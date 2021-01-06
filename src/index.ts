import "reflect-metadata";
import LocalStrategy from 'passport-local';
import {createConnection, getManager} from "typeorm";
import * as express from "express";
import session from 'express-session'
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
import { UserPlaylist } from "./entity/UserPlaylist";
import { RecommendedPlaylist } from "./entity/RecommendedPlaylist";
import { RecommendationService } from "./service/RecommendationService";
import { SpotifyRequestsService } from "./service/SpotifyRequestsService";
import axios from 'axios'
import { resolve } from "url";
import jwt from 'express-jwt';
import { PassportConfig } from "./config/PassportConfig";
import { nextTick } from "process";
const passport = require('passport');

const getTokenFromHeaders = (req) => {
    const {headers: {authorization}} = req;
    if(authorization && authorization.split(' ')[0] === 'Bearer') {
        return authorization.split(' ')[1];
    }
    return null;
}

const auth = {
    required: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
        algorithms: ['HS256']
    }),
    optional: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
        algorithms: ['HS256'],
        credentialsRequired: false
    }),
}

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
    } else if(parseInt(req.query.limit) < 1 || parseInt(req.query.limit ) > 50 ) {
        res.json(new ApiResponse(new ApiError(400, `Wrong parameter input, expected integer <1;50>`)))
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
    //initialize repositories
    const userRepository = connection.getRepository(User);
    const spotifyTracksRepository = connection.getRepository(SpotifyTrack);
    const recentTracksRepository = connection.getRepository(RecentlyPlayedTracks);
    const userPlaylistRepository = connection.getRepository(UserPlaylist);
    const recommentedPlaylistRepository = connection.getRepository(RecommendedPlaylist);
    const entityManager = getManager();
    const recommendationService = new RecommendationService(entityManager);

    // create express app
    const app = express();
    const passportConf = new PassportConfig(userRepository);
    passportConf.setPassportConfig()
    // add middlewares
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use('/proposals/top', limitParamCheck);
    app.use('/proposals/gpsy', limitParamCheck);
    app.use('/gpsy/playlists/recommend', limitParamCheck);
    app.use(session({secret: 'gpsy', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}))
    //app.use(unlessCheck(authenticateCheck, "/callback", "/test", "/test2"));
    // app.use(unlessCheck(async (req, res, next) => {
    //     if(!await checkAuthenticaton(userRepository, req.query.login, req.query.password)) {
    //         let message =  `User ${req.query.login} not authenticated!`;
    //         console.error(message);
    //         res.json(new ApiResponse(new ApiError(405, message)));
    //         return;
    //     } else {
    //         next();
    //     }
    // }, "/callback", "/register", "/test", "/test2"));

    //set spotify existing apis
    let apiRetrievedForUser = await SpotifyUserService.retrieveSpotifyUsersSavedToDb(userRepository);
    apiRetrievedForUser.forEach((value, key) => {
        API_INSTANCES.set(key, value);
    });
    //Schedule jobs for users 
    Scheduler.scheduleTokenAndRecetTracks(recentTracksRepository
                                        , userRepository
                                        , spotifyTracksRepository
                                        , userPlaylistRepository
                                        , API_INSTANCES
                                        ,recommendationService
                                        );
    // register express routes from defined application routes
    // Routes.forEach(route => {
    //     (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
    //         const result = (new (route.controller as any))[route.action](req, res, next);
    //         if (result instanceof Promise) {
    //             result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);

    //         } else if (result !== null && result !== undefined) {
    //             res.json(result);
    //         }
    //     });
    // });

    app.get('/test2',auth.required,async (req, res) => {
        //let db = await recommentedPlaylistRepository.findOne({name: 'impressional', actual: true});
        console.log('hello')
        res.json('Hello')
    })
/*
    ===============================================================================
    PATH: /register
    METHOD: POST
    DESCRIPTION: Allows registration, after that, the spotify login process is allowed and new user is registered
    ===============================================================================
*/
    app.post('/register', async (req: Request, res: Response) => {
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

/*
    ===============================================================================
    PATH: /login
    METHOD: GET
    DESCRIPTION: Allows access to spotify data - executed only once, after registration
    ===============================================================================
*/
app.post('/login',auth.optional, async (req: Request, res: Response) => {
    
    return passport.authenticate('local', {session: false}, (err, passportUser, info) => {
        if(err) return res.json(err);
        console.log(passportUser)
        if(passportUser) {
            const user: User = passportUser;
            return res.json(
                {
                    username: user.login,
                    spotifyId: user.id,
                    token: user.generateJWT()
                });
        }
        console.log(info)
        res.status(400);
        res.json(info);
    })(req, res)
});

/*
    ===============================================================================
    PATH: /allowSpotify
    METHOD: GET
    DESCRIPTION: Allows access to spotify data - executed only once, after registration
    ===============================================================================
*/
    app.get('/allow-spotify', async (req: Request, res: Response) => {
        try {
            let user = await userRepository.findOne(req.query.login);
            if(user && user.id) {
                res.json(new ApiResponse(new ApiSuccess(`Already joined your spotify account!`)));
                return;
            }
        } catch(err) {
            res.json(new ApiResponse(new ApiError(99, `Cannot join your account now! Try later!`)));
            return;
        }

        const spotifyApi = new SpotifyWebApi({
            redirectUri: `${config.domain}/callback`,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET
          });
        TEMP_LOGIN_TO_USER_AUTH = req.query.login; // ==> give the temp user login state to process
        res.redirect(spotifyApi.createAuthorizeURL(scopes));
    });

/*
    ===============================================================================
    PATH: /callback
    METHOD: GET
    DESCRIPTION: Callback for login spotify process
    ===============================================================================
*/ 
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
                    API_INSTANCES.set(req.query.login, [spotifyApi, new Date(), new Date(), new Date()]);
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

/*
    ===============================================================================
    PATH: /spotify/played/now
    METHOD: GET
    DESCRIPTION: Gives propsals from gpsy, based on most frequently heard tracks
    ===============================================================================
*/
    app.get('/spotify/played/now', async (req, res) => {
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

/*
    ===============================================================================
    PATH: /spotify/proposals/top
    QUERY PARAMS: ?limit=integer<1,10>
    METHOD: GET
    DESCRIPTION: Gives propsals from gpsy, based on most frequently heard tracks
    ===============================================================================
*/
    app.get('/spotify/proposals/top', async(req, res) => {
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
/*
    ===============================================================================
    PATH: /spotify/proposals
    QUERY PARAMS: ?limit=integer<1,10>
    METHOD: GET
    DESCRIPTION: Gives propsals from gpsy, based on most frequently heard tracks
    ===============================================================================
*/
    app.get('/spotify/proposals', async (req: Request, res: Response) => {
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

/*
    ===============================================================================
    PATH: gpsy/proposals
    QUERY PARAMS: ?limit=integer<1,10>
    METHOD: GET
    DESCRIPTION: Gives propsals from gpsy, based on most frequently heard tracks
    ===============================================================================
*/
    app.get('/gpsy/proposals', async (req: Request, res: Response) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        try {
            let user: User = await userRepository.findOne(req.query.login);
            if(user) {
                res.json(await recommendationService.recommendTracksFromGpsy(parseInt(req.query.limit), spotifyApi, user));
            } else {
                console.error(`[${new Date().toISOString()}] User ${req.query.login} not found in database`);
                res.json(new ApiResponse(new ApiError(455, `User not found. Make sure you are registered!`)));
            }
        } catch(err) {
            console.error('Something went wrong: ', err)
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)));
        }
    
       
    }); 

/*
    ===============================================================================
    PATH: /search/tracks
    QUERY PARAMS: ?phrase=string<2,20>
                    &byAuthorName {true, false} OPTIONAL
    METHOD: GET
    DESCRIPTION: Receiving spotify tracks based on searching param. If byAuthorName provided, the searchig will be provided not
                only by title but as well by author
    ===============================================================================
*/
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
                        popularity: el.popularity,
                        durationMs: el.duration_ms
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
                            popularity: el.popularity,
                            durationMs: el.duration_ms
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

/*
    ===============================================================================
    PATH: /spotify/playlists
    QUERY PARAMS: ?id=spotifyPlaylistId
    METHOD: GET
    DESCRIPTION: Retrieving user playlists from spotify, if id provided, the playlist with songs will be retrieved
    ===============================================================================
*/       
    app.get('/spotify/playlists', async (req, res) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        try {
            let user: User = await userRepository.findOne(req.query.login);
        
            if(user) {
                if(req.query.id) {
                   try {
                    let response = await SpotifyRequestsService.retrieveUserPlaylistTracks(
                        req.query.id
                        ,user
                        ,spotifyApi
                        ,userPlaylistRepository
                        ,spotifyTracksRepository
                    )
                    res.json(response);

                   } catch(err) {
                        console.error(`[${new Date().toISOString()}] User ${req.query.login} tracks retrieve from playlist internal error`, err);
                        res.json(new ApiResponse(new ApiError(455, `Cannot retrieve the tracks properly. Try again later`)));  
                   }
                } else {
                    try {
                        let response = await SpotifyRequestsService.retrieveUserPlaylists(
                            user,
                            spotifyApi,
                            userPlaylistRepository
                        )
                        res.json(response);
                       } catch(err) {
                            console.error(`[${new Date().toISOString()}] User ${req.query.login} tracks retrieve from playlist internal error`, err);
                            res.json(new ApiResponse(new ApiError(455, `Cannot retrieve the tracks properly. Try again later`)));  
                       }
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${req.query.login} not found in database`);
                res.json(new ApiResponse(new ApiError(455, `User not found. Make sure you are registered!`)));
            }
        } catch(err) {
            console.error('Something went wrong: ', err)
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)));
        }
    });

/*
    ===============================================================================
    PATH: /playlists/spotify/track/add
    METHOD: POST
    DESCRIPTION: Adding tracks to existing spotify playlist. The frame should be look like:
    {
    "playlistId": "2ptqwasYqv1677gL4OEkIL",
    "tracks":[
            {
            "trackId": "5hnyJvgoWiQUYZttV4wXy6"
            }
        ]
    }
    ===============================================================================
*/
    app.post('/spotify/playlists/track/add', async (req, res) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        try {
            let user: User = await userRepository.findOne(req.query.login);
            if(user) {
                try {
                let response = await SpotifyRequestsService.addTracksToPlaylist(req.body.playlistId 
                                                                                ,req.body.tracks
                                                                                ,user
                                                                                ,spotifyApi
                                                                                ,userPlaylistRepository
                                                                                ,spotifyTracksRepository);
                if(response.status === 0 && response.message instanceof ApiSuccess) {
                    res.status(201);
                }
                res.json(response);
                } catch(err) {
                    console.error(`[${new Date().toISOString()}] User ${req.query.login} tracks add internal error`, err);
                    res.json(new ApiResponse(new ApiError(455, `Cannot add the tracks properly. Try again later`)));  
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${req.query.login} not found in database`);
                res.json(new ApiResponse(new ApiError(455, `User not found. Make sure you are registered!`)));
            }
        } catch(err) {
            console.error('Something went wrong: ', err)
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)));
        }
    });

/*
    ===============================================================================
    PATH: /spotify/playlists/add
    METHOD: POST
    DESCRIPTION: Adding new playlist to spotify, request MUST contain the body:
        {
            "name": "Test",
            "description": "test description",
            "public": "false"
        }
    ===============================================================================
*/
    app.post('/spotify/playlists/add', async (req, res) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        try {
            let user: User = await userRepository.findOne(req.query.login);
            if(user) {
                try {
                    let response = await SpotifyRequestsService.addSpotifyPlaylist(
                        req.body.name
                        ,req.body.public
                        ,req.body.description ? req.body.description : ''
                        ,spotifyApi
                        ,user
                        ,userPlaylistRepository
                    )
                    if(response.status === 0 && response.message instanceof ApiSuccess) {
                        res.status(201);
                        res.json(response);
                    } else {
                        console.error(`[${new Date().toISOString()}] User ${req.query.login} internal error`);
                        res.json(response);
                    }
                } catch(err) {
                    console.error(`[${new Date().toISOString()}] User ${req.query.login} internal error`, err);
                    res.json(new ApiResponse(new ApiError(455, `Cannot add the playlist properly. Try again later`)));
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${req.query.login} not found in database`);
                res.json(new ApiResponse(new ApiError(455, `User not found. Make sure you are registered!`)));
            }
        } catch(err) {
            console.error('Something went wrong: ', err)
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)));
        }
    });

/*
    ===============================================================================
    PATH: /gpsy/playlists/recommend
    QUERY PARAMS: ?limit=integer<1,10>
                  &name=string<5,20>
    METHOD: GET
    DESCRIPTION: Internal playlist generation with proposed tracks, if does not exist it creates one from standard. 
                If name provided the name will be used to generate the pl.
    ===============================================================================
*/
    app.get('/gpsy/playlists/recommend', async (req, res) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];
        if(req.query.name && (req.query.name.length < 5 || req.query.name.length > 20)) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter, expected [name](type: string, length: min. 5, max 15)`)))
            return;
        }
        
        try {
            let user: User = await userRepository.findOne(req.query.login);
            if(user) {
                let playlistName = req.query.name ? req.query.name : config.recommendedPlaylistName;   
                let playlist: RecommendedPlaylist = null;
                if(!req.query.name) {
                    playlist = await recommentedPlaylistRepository.findOne({userId: user.id, actual: true})
                } else {
                    playlist = await recommentedPlaylistRepository.findOne({userId: user.id, name: playlistName})
                }
                
                if(!playlist) {
                    //create new playlist
                    try {
                        playlist = await recommentedPlaylistRepository.save({
                            userId: user.id,
                            name: playlistName,
                            description: 'The playlist created for gpsy proposals',
                            trackQuantity: req.query.limit ? req.query.limit : 20,
                            actual: true,
                            public: false
                        })

                    } catch(err) {
                        console.error(`[${new Date().toISOString()}] User ${req.query.login} problem with saving new rec. playlist`, err);
                        res.json(new ApiResponse(new ApiError(460, `Cannot save recommended playlist! Internal error`)));
                    }
                } else if(req.query.limit) {
                    playlist.trackQuantity = req.query.limit;
                }
                
                //check if exists playlist already and change status actual to false, if we do not want to modify actual
                let exisitng: RecommendedPlaylist = await recommentedPlaylistRepository.findOne({userId: user.id, actual: true});
                if(exisitng && playlist.spotifyPlaylistId !== exisitng.spotifyPlaylistId) {
                    exisitng.actual = false;
                    await recommentedPlaylistRepository.save(exisitng);
                }

                try {
                    let apiResponse = await recommendationService.recommendTracksFromGpsy(playlist.trackQuantity, spotifyApi, user);
                    
                    if(apiResponse.status === 0 && apiResponse.message instanceof ApiSuccess) {

                        let gpsyRecommendations = apiResponse.message.data;
                        let toInsertTracks: SpotifyTrack[] = [];
                        for(let track of gpsyRecommendations) {
                            let dbTrack: SpotifyTrack = await spotifyTracksRepository.findOne(track.trackId);
                            if(!dbTrack) {
                                dbTrack = await spotifyTracksRepository.save(track);
                            }
                            toInsertTracks.push(dbTrack);
                        }
                        playlist.tracks = toInsertTracks;
                        playlist.actual = true;
                        try {
                            await recommentedPlaylistRepository.save(playlist);
                            res.json(new ApiResponse(new ApiSuccess(playlist)));
                        } catch(err) {
                            console.error(`[${new Date().toISOString()}] User ${req.query.login} cannot save new recommended playlist`, err);
                            res.json(new ApiResponse(new ApiError(460, `Cannot save recommended playlist! Internal error`)));
                        }
                    } else {
                        console.error(`[${new Date().toISOString()}] User ${req.query.login} problem with retrieving recommendations for playlist`);
                        res.json(new ApiResponse(new ApiError(460, `Cannot retrieve recommended tracks for playlist! Internal error`)));
                    }
                } catch(err) {
                    console.error(`[${new Date().toISOString()}] User ${req.query.login} problem with retrieving recommendations for playlist`, err);
                    res.json(new ApiResponse(new ApiError(460, `Cannot retrieve recommended tracks for playlist! Internal error`)));
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${req.query.login} not found in database`);
                res.json(new ApiResponse(new ApiError(455, `User not found. Make sure you are registered!`)));
            }
        } catch(err) {
            console.error('Something went wrong: ', err)
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)));
        }
    });

/*
    ===============================================================================
    PATH: /gpsy/playlists/recommend
    METHOD: POST
    DESCRIPTION: Internal playlist generation with proposed tracks, if does not exist it creates one from standard. 
                If name provided the name will be used to generate the pl.
    ===============================================================================
*/
    app.post('/gpsy/playlists/send-actual', async (req, res) => {
        let spotifyApi = API_INSTANCES.get(req.query.login)[0];  
        try {
            let user: User = await userRepository.findOne(req.query.login);
            if(user) {
                let playlist: RecommendedPlaylist = await recommentedPlaylistRepository.findOne({userId: user.id, actual: true})
                if(playlist) {
                    if(!playlist.sentToSpotify) {
                        try {
                            let response = await SpotifyRequestsService.addSpotifyPlaylist(
                                playlist.name
                                ,true
                                ,playlist.description ? playlist.description : ''
                                ,spotifyApi
                                ,user
                                ,userPlaylistRepository
                            )
                            if(response.status === 0 && response.message instanceof ApiSuccess) {
                                playlist.sentToSpotify = true;
                                playlist.sentToSpotifyDate = new Date();
                                playlist.spotifyPlaylistId = response.message.data.spotifyPlaylistId;
                                await recommentedPlaylistRepository.save(playlist);
                                res.status(201);
                            } else {
                                res.json(response);
                                return;
                            }
                            try {
                                let response = await SpotifyRequestsService.addTracksToPlaylist(
                                    playlist.spotifyPlaylistId
                                    ,playlist.tracks
                                    ,user
                                    ,spotifyApi
                                    ,userPlaylistRepository
                                    ,spotifyTracksRepository
                                )
                                if(response.status === 0 && response.message instanceof ApiSuccess) {
                                    res.status(201);
                                    console.info(`[${new Date().toISOString()}] ${user.email} sent recommended playlist ${playlist.spotifyPlaylistId} to spotify`)
                                    res.json(new ApiResponse(new ApiSuccess(playlist)))
                                } else {
                                    res.json(response)
                                }
                            } catch(err) {
                                console.error(`[${new Date().toISOString()}] User ${req.query.login} tracks add internal error`, err);
                                res.json(new ApiResponse(new ApiError(455, `Cannot add the tracks properly. Try again later`)));
                            }
                        } catch(err) {
                            console.error(`[${new Date().toISOString()}] User ${req.query.login} playlist add internal error`, err);
                            res.json(new ApiResponse(new ApiError(455, `Cannot add the playlist properly. Try again later`)));
                        }
                    } else {
                        try {
                            let currPlaylist = await userPlaylistRepository.findOne(playlist.spotifyPlaylistId);
                            let currPlaylistTracks = currPlaylist.tracks.map(el => {
                                return {uri: `spotify:track:${el.trackId}`}
                            })
                            if(currPlaylistTracks.length) {
                                let response = await spotifyApi.removeTracksFromPlaylist(playlist.spotifyPlaylistId, currPlaylistTracks);
                                if(response.statusCode && response.statusCode === 200) {
                                    currPlaylist.tracks = [];
                                    await userPlaylistRepository.save(currPlaylist);
                                }
                            }
                        } catch(err) {
                            console.error(`[${new Date().toISOString()}] ${user.email} cannot delete current tracks for ${playlist.spotifyPlaylistId} from spotify`, err)
                            res.json(new ApiResponse(new ApiError(455, `Cannot delete current tracks for ${playlist.spotifyPlaylistId} from spotify`)))
                            return;
                        }
                        try {
                            let response = await SpotifyRequestsService.addTracksToPlaylist(
                                playlist.spotifyPlaylistId
                                ,playlist.tracks
                                ,user
                                ,spotifyApi
                                ,userPlaylistRepository
                                ,spotifyTracksRepository
                            )
                            if(response.status === 0 && response.message instanceof ApiSuccess) {
                                res.status(201);
                            }
                            console.info(`[${new Date().toISOString()}] ${user.email} sent recommended tracks for ${playlist.spotifyPlaylistId} to spotify`)
                            res.json(response)
                        } catch(err) {
                            console.error(`[${new Date().toISOString()}] User ${req.query.login} tracks add internal error`, err);
                            res.json(new ApiResponse(new ApiError(455, `Cannot add the tracks properly. Try again later`)));
                        }
                    }
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${req.query.login} not found in database`);
                res.json(new ApiResponse(new ApiError(455, `User not found. Make sure you are registered!`)));
            }
        } catch(err) {
            console.error('Something went wrong: ', err)
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)));
        }
    });

    // START EXPRESS APP
    app.listen(process.env.PORT || 8080, () => {
        console.info(`App listening at port ${process.env.PORT || 8080}`);
    });

}).catch(error => console.info(error));
