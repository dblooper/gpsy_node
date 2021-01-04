import "reflect-metadata";
import {createConnection, getManager} from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import {Request, Response} from "express";
import {Routes} from "./routes";
import {User} from "./entity/User";
import config from '../config.json';
import * as dotenv from 'dotenv';
import { ApiResponse } from "./apiResponse/ApiResponse";
import { ApiError } from "./apiResponse/ApiError";
import { ApiSuccess } from "./apiResponse/ApiSuccess";
import { RecentlyPlayedTracks } from "./entity/RecentlyPlayedTracks";
import { SpotifyTrack } from "./entity/SpotifyTrack";
import * as bcrypt from 'bcrypt';
import { Scheduler } from "./sheduler/Sheduler";
import { SpotifyUserService } from "./service/SpotifyUserService";
dotenv.config();

var TEMP_LOGIN_TO_USER_AUTH = '';
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');

//spotify data
const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];
const API_INSTANCES = new Map();

const authenticateCheck = function(req, res, next) {
    if(!req.query.login || req.query.login.length < 5) { 
        res.json(new ApiResponse(new ApiError(420, `Wrong parameter, expected [login] with length min 5`)))
        return;
    } else if(!req.query.password || req.query.login.length < 5) {
        res.json(new ApiResponse(new ApiError(420, `Wrong parameter, expected [password]`)))
        return;
    }
    next();
}

const limitParamCheck = (req, res, next) => {
    if(req.query.length === 0 || !req.query.limit) {
        res.json(new ApiResponse(new ApiError(400, `Wrong parameter, expected [limit](type: int)`)))
        return;
    } else if(parseInt(req.query.limit) < 1 || parseInt(req.query.limit ) > 20 ) {
        res.json(new ApiResponse(new ApiError(400, `Wrong parameter input, expected integer <1;20>`)))
        return;
    }
    next()
}

const checkAuthenticaton = async (userRepository, login, password) => {
    let user: User = await userRepository.findOne(login);
    if(user) {
        return await bcrypt.compare(password, user.password)
    } else {
        return false;
    }
}

const unlessCheck = function(middleware, ...paths) {
    return function(req, res, next) {
        const pathCheck = paths.some(path => path === req.path);
        pathCheck ? next() : middleware(req, res, next);
    }
}

createConnection().then(async connection => {
    const userRepository = connection.getRepository(User);
    const spotifyTracksRepository = connection.getRepository(SpotifyTrack);
    const recentTracksRepository = connection.getRepository(RecentlyPlayedTracks);
    const entityManager = getManager();
    // create express app
    const app = express();
    // add middlewares
    app.use(bodyParser.json());
    app.use(unlessCheck(authenticateCheck, "/callback"));
    app.use('/proposals/top', limitParamCheck)
    app.use('/proposals/gpsy', limitParamCheck)
    app.use(unlessCheck(async (req, res, next) => {
        if(!await checkAuthenticaton(userRepository, req.query.login, req.query.password)) {
            let message =  `User ${req.query.login} not authenticated!`;
            console.error(message);
            res.json(new ApiResponse(new ApiError(405, message)));
            return;
        } else {
            next();
        }
    }, "/callback"));

    //set spotify existing apis
    let apiRetrievedForUser = await SpotifyUserService.retrieveSpotifyUsersSavedToDb(userRepository);
    apiRetrievedForUser.forEach((value, key) => {
        API_INSTANCES.set(key, value);
    });
    //Schedule jobs for users 
    Scheduler.scheduleTokenAndRecetTracks(recentTracksRepository, userRepository, spotifyTracksRepository, API_INSTANCES);

    // register express routes from defined application routes
    Routes.forEach(route => {
        (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
            const result = (new (route.controller as any))[route.action](req, res, next);
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);

            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
    });

    app.get('/register', async (req: Request, res: Response) => {
        try {
            let user = await userRepository.findOne(req.query.login);
            if(!user) {
                let hash = await bcrypt.hash(req.query.password, 12)
                await userRepository.save({
                    login: req.query.login,
                    password: hash
                })
                console.info(`${new Date().toISOString()}: New user ${req.query.login} registered!`);
                res.json(new ApiResponse(new ApiSuccess(`Welcome ${req.query.login}. Registration success!`)))
            } else {
                let message = `User ${req.query.login} exists!`
                console.error(message);
                res.json(new ApiResponse(new ApiError(401, message)));
            }
        } catch(err) {
            console.error(`Error from registration`, err)
            res.json(new ApiResponse(new ApiError(402, `Error from registration. Try again later`)));
        }
    });

    //START SPOTIFY AUTHORIZATION PROCESS
    app.get('/login', async (req: Request, res: Response) => {
        const spotifyApi = new SpotifyWebApi({
            redirectUri: `${config.domain}/callback`,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET
          });
        TEMP_LOGIN_TO_USER_AUTH = req.query.login; // ==> give the temp user login state to process
        res.redirect(spotifyApi.createAuthorizeURL(scopes));
    });
    
    app.get('/callback', (req: Request, res: Response) => {
        const error = req.query.error;
        const code = req.query.code;
        const spotifyApi = new SpotifyWebApi({
            redirectUri: `${config.domain}/callback`,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET
        });

        if (error) {
            console.error('Callback Error:', error);
            res.json(new ApiResponse(new ApiError(100, `Callback Error: ${error}`)));
            return;
        }

        spotifyApi
                .authorizationCodeGrant(code)
                .then(async data => {
                    const access_token = data.body['access_token'];
                    const refresh_token = data.body['refresh_token'];
                    const expires_in = data.body['expires_in'];

                    spotifyApi.setAccessToken(access_token);
                    spotifyApi.setRefreshToken(refresh_token);

                    let me = null;
                    try {
                        me = await spotifyApi.getMe();
                    } catch(err) {    
                        console.error('Cannot access user data: ', err);
                        res.json(new ApiResponse(new ApiError(20, `Cannot access user data`)));
                        return;
                    }
                
                    //save retrieved data of user
                    API_INSTANCES.set(req.query.login, [spotifyApi, new Date(), new Date()]);
                    let userRepositoryFound:User = null;
                    try {
                        userRepositoryFound = await userRepository.findOne(TEMP_LOGIN_TO_USER_AUTH);
                    } catch(err) {
                        console.info('Cannot access user data from db: ' + err);
                        res.json(new ApiResponse(new ApiError(50, `Cannot access user data from db`)));
                        return;
                    }
                
                    if(userRepositoryFound && !userRepositoryFound.id) {
                        userRepositoryFound.id =  me.body.id;
                        userRepositoryFound.email = me.body.email;
                        userRepositoryFound.name = me.body.display_name;
                        userRepositoryFound.spotifyRefreshToken = refresh_token;
                        await userRepository.save(
                            userRepositoryFound
                        )
                    }
                    TEMP_LOGIN_TO_USER_AUTH = ''; // <== give the global variable the initial state
                    console.info(
                        `Sucessfully retreived access token for ${me.body.email}. Expires in ${expires_in} s.`
                    );
                    res.append('Login', userRepositoryFound.login);
                    res.json(new ApiResponse(new ApiSuccess(`Success authorization to ${me.body.display_name}! Now you can close the window and explore the app!`)));
                })
                .catch(error => {
                    console.error('Error getting Tokens:', error);
                    res.json(new ApiResponse(new ApiError(11, `Error getting Tokens: ${error}`)));
                });
    });
    //STOP SPOTIFY AUTHORIZATION PROCESS
    app.get('/played/now', async (req, res) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        spotifyApi
                .getMyCurrentPlayingTrack()
                .then(function(data) {
                    if(Object.keys(data.body).length !== 0) {
                        res.json(new ApiResponse(new ApiSuccess(
                            {id: data.body.item.id,
                            name: data.body.item.name,
                            popularity: data.body.item.popularity,
                            artistId: data.body.item.artists[0].id,
                            artist: data.body.item.artists[0].name,
                            url: data.body.context.external_urls.spotify,
                            progress_ms: data.body.progress_ms,
                            duration_ms: data.body.item.duration_ms 
                        })));
                    } else {
                        res.json(new ApiResponse(new ApiSuccess('Nothing currently played')))
                    }
                }, function(err) {
                    console.error('Something went wrong!', err);
                    res.json(new ApiResponse(new ApiError(10, `User not logged in`)));
                });
    });

    app.get('/proposals/top', async(req, res) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        let me =null
        try {
            me = await spotifyApi.getMe();
        } catch(err) {
            console.error('Something went wrong!', err);
            res.json(new ApiResponse(new ApiError(10, `User not logged in`)));
            return;
        }
        spotifyApi
                .getMyTopTracks({limit: req.query.limit})
                .then((data) => {
                    let mapped = data.body.items.map(el => {
                        return {id: el.id, 
                                name: el.name, 
                                author: el.artists[0].name,
                                authorId: el.artists[0].id,
                                album: el.album.name,
                                albumId: el.album.id}})
                    //console.log(mapped);
                    res.json(mapped);
                },(err) => {
                    console.error('Something went wrong!', err);
                    res.json(new ApiResponse(new ApiError(10, `User not logged in`)))
                });
    })

    app.get('/proposals/spotify', async (req: Request, res: Response) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        if(req.query.length === 0 || !req.query.limit) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter, expected "limit"(type: int)`)))
            return;
        } else if(parseInt(req.query.limit) < 1 || parseInt(req.query.limit ) > 20 ) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter input, expected integer <1;20>`)))
            return;
        }

        let mostFrequent = null;
        let topTracks = null;
        try {
            topTracks = await spotifyApi
                            .getMyTopTracks({limit: 5});
            
            topTracks = topTracks.body.items.map(el => {
                                                            return {id: el.id, 
                                                                name: el.name, 
                                                                author: el.artists[0].name,
                                                                authorId: el.artists[0].id,
                                                                album: el.album.name,
                                                                albumId: el.album.id}
                                                        })
        } catch(err) {
            console.error('Something went wrong!', err);
            res.json(new ApiResponse(new ApiError(10, `User not logged in`))); //TODO napisac ze problem z baza
            return;
        }
        mostFrequent = topTracks.map(el => el.id)

        spotifyApi
                .getRecommendations({
                        min_energy: 0.4,
                        seed_tracks: mostFrequent,
                        limit: req.query.limit,
                        min_popularity: 60
                    })
                .then(function(data) {
                let recommendations = data.body.tracks;
                res.json(new ApiResponse(new ApiSuccess(recommendations.map(el => {return {id: el.id, name: el.name, author: el.artists[0].name, album: el.album.name}}))))
                }, function(err) {
                    console.error('Something went wrong!', err);
                    res.json(new ApiResponse(new ApiError(10, `User not logged in`)));
                });
    }); 

    app.get('/proposals/gpsy', async (req: Request, res: Response) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        let me = null;
        let mostFrequent = null;
        try {
            me = await spotifyApi.getMe();
        } catch(err) {
            console.error('Something went wrong!', err);
            res.json(new ApiResponse(new ApiError(10, `User not logged in`)));
            return;
        }
        try {
            mostFrequent = await entityManager.query(
                `select 
                    rpt.spotifyTrackId
                    ,rpt.userId
                    ,count(rpt.spotifyTrackId) as 'timesPlayed' 
                from recently_played_tracks as rpt
                where 
                    rpt.userId = ?
                group by
                    rpt.spotifyTrackId
                    ,rpt.userId
                order by 
                    count(rpt.spotifyTrackId) desc
                limit 5`, [me.body.id ? me.body.id : '']
            )
        } catch(err) {
            console.error('Something went wrong!', err);
            res.json(new ApiResponse(new ApiError(10, `User not logged in`))); //TODO napisac ze problem z baza
            return;
        }
        mostFrequent = mostFrequent.map(el => el.spotifyTrackId)

        spotifyApi
                .getRecommendations({
                    min_energy: 0.4,
                    seed_tracks: mostFrequent,
                    limit: req.query.limit,
                    min_popularity: 60
                })
                .then(function(data) {
                let recommendations = data.body.tracks;
                res.json(new ApiResponse(new ApiSuccess(recommendations.map(el => {return {id: el.id, name: el.name, author: el.artists[0].name, album: el.album.name}}))))
                }, function(err) {
                    console.error('Something went wrong!', err);
                    res.json(new ApiResponse(new ApiError(10, `User not logged in`)));
                });
    }); 

    app.get('/search/tracks', async (req, res) => {
        if(req.query.phrase === 0 || !req.query.phrase) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter, expected [phrase](type: string)`)))
            return;
        } else if(parseInt(req.query.phrase) < 2 || parseInt(req.query.phrase ) > 20 ) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter input, expected string length <2;20>`)))
            return;
        }
        let includeAuthor = false;
        if(req.query.byAuthorName && req.query.byAuthorName !== 'true' && req.query.byAuthorName !== 'false') {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter input, expected true, false`)))
            return;
        } else if(req.query.byAuthorName === 'true') {
            includeAuthor = true;
        }
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        let tracksNames = null;
        let tracksByArtist = null;
        try {
            tracksNames = await spotifyApi.searchTracks(req.query.phrase);
            if(tracksNames) {
                tracksNames = tracksNames.body.tracks.items.map(el => {
                    return {id: el.id, 
                        name: el.name, 
                        author: el.artists[0].name,
                        authorId: el.artists[0].id,
                        album: el.album.name,
                        albumId: el.album.id,
                        popularity: el.popularity
                    }});
                }
            if(includeAuthor) {
                tracksByArtist = await spotifyApi.searchTracks(`artist:${req.query.phrase}`)
                if(tracksByArtist) {
                    tracksByArtist = tracksByArtist.body.tracks.items.map(el => {
                        return {id: el.id, 
                            name: el.name, 
                            author: el.artists[0].name,
                            authorId: el.artists[0].id,
                            album: el.album.name,
                            albumId: el.album.id,
                            popularity: el.popularity
                        }});
                }
            } else {
                tracksByArtist = [];
            }
            let searchedTracks = [...tracksNames, ...tracksByArtist];
            searchedTracks.sort((a, b) => b.popularity - a.popularity)
            res.json(new ApiResponse(new ApiSuccess(searchedTracks)));
        } catch(err) {
            console.error('Something went wrong', err);
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)))
        }
    })

    // START EXPRESS APP
    app.listen(process.env.PORT || 8080, () => {
        console.info(`App listening at port ${process.env.PORT || 8080}`);
    });

}).catch(error => console.info(error));
