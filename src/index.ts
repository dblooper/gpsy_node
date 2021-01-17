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
import SpotifyTracksRequestsService from "./service/SpotifyTracksRequestsService";
import jwt from 'express-jwt';
import { PassportConfig } from "./config/PassportConfig";
import { SpotifyPlaylistRequestService } from "./service/SpotifyPlaylistRequestService";
import {factory} from './config/LoggerConfig'
const LOG = factory.getLogger("index.Main");
const passport = require('passport');

const getTokenFromHeaders = (req) => {
    const {headers: {authorization}} = req;
    if(authorization && authorization.split(' ')[0] === 'Bearer') {
        return authorization.split(' ')[1];
    } else if(req.query.token) {
        return req.query.token;
    }
    return null;
}

const auth = {
    required: jwt({
        secret: 'secret-gpsy-app',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
        algorithms: ['HS256']
    }),
    optional: jwt({
        secret: 'secret-gpsy-app',
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

const checkRegistrationBody = (req, res, next) => {
    let errors = [];

    if(!req.body.username || !req.body.password) {
        errors.push({
            error1: 'Wrong username or password'
        })
    } 
    if(req.body.username.length < 6) {
        errors.push({
            error: 'Username length too short. At least 6 characters required'
        })
    }

    if(req.body.password.length < 8) {
        errors.push({
            error: 'Password length too short. At least 8 characters required'
        })
    }

    if(! /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9]{8,20}$/.test(req.body.password)) {
        errors.push({
            error: 'Password does not comply with rule: at least 1 small letter, 1 digit, 1 capital letter'
        })
    }
    
    if(errors.length) {
        res.json(new ApiResponse(new ApiError(1, (errors))));
    } else {
        next()
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
    app.use('/register', checkRegistrationBody);
    app.use(session({secret: 'gpsy', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}))
    
    //set spotify existing apis
    let apiRetrievedForUser = await SpotifyUserService.retrieveSpotifyUsersSavedToDb(userRepository);
    if (apiRetrievedForUser) {
        apiRetrievedForUser.forEach((value, key) => {
            API_INSTANCES.set(key, value);
        });
    }
    //Schedule jobs for users 
    Scheduler.scheduleTokenAndRecetTracks(recentTracksRepository
                                        , userRepository
                                        , spotifyTracksRepository
                                        , userPlaylistRepository
                                        , API_INSTANCES
                                        ,recommendationService
                                        ,connection
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

    app.get('/test2', auth.required,async (req, res) => {
        //let db = await recommentedPlaylistRepository.findOne({name: 'impressional', actual: true});
        // let user = new User()
        // let tokenDecoded = user.decodeJWT(req.query.token);
        // res.json({
        //     generated: new Date(tokenDecoded.iat*1000),
        //     expiration: new Date(tokenDecoded.exp*1000)
        // })
        let api = API_INSTANCES.get('daniel')[0];
        api.getArtist('1jZNTB1uy71babTxJFEryZ').then(
            function (data) {
              console.log('Artist information', data);
            },
            function (err) {
              console.error(err);
            }
          );

        
        // let resp = await api.getMyRecentlyPlayedTracks({
        //     limit : 1
        // });;
        // console.log(resp.body);
        // console.log(JSON.stringify(resp, null, 1))
         res.json('resp');

    })
/*
    ===============================================================================
    PATH: /register
    METHOD: POST
    DESCRIPTION: Allows registration, after that, the spotify login process is allowed and new user is registered
    ===============================================================================
*/
    app.post('/register', auth.optional ,async (req: Request, res: Response) => {
        try {
            let user = await userRepository.findOne(req.body.username);
            if(!user) {
                user = new User();
                user.login = req.body.username;
                let firstToken = user.generateJWT();
                await user.setPassword(req.body.password);
                await userRepository.save(user);
                console.info(`${new Date().toISOString()}: New user ${req.body.username} registered!`);
                res.json(new ApiResponse(new ApiSuccess({
                                                            username: user.login,
                                                            spotifyId: user.id,
                                                            token: firstToken
                                                        })))
            } else {
                let message = {error: `User ${user.login} exists!`}
                res.json(new ApiResponse(new ApiError(1, message)));
            }
        } catch(err) {
            LOG.error(`Error from registration`, err)
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

        if(passportUser) {
            const user: User = passportUser;
            return res.json(new ApiResponse(new ApiSuccess( {
                username: user.login,
                spotifyId: user.id,
                token: user.generateJWT()
            }))
               );
        }
        res.status(400);
        res.json(info);
    })(req, res)
});

/*
    ===============================================================================
    PATH: /user/statistics
    METHOD: GET
    DESCRIPTION: Returns user data required by UI side drawer
    ===============================================================================
*/
app.get('/user/statistics', auth.required, async(req, res) => {
    let token = req.headers.authorization.split(' ');
    let decodedToken = User.decodeJWT(token[1]);
    const userStat = {};
    try {
        let user = await userRepository.findOne(decodedToken.login)
        if(user) {
            let best = await entityManager.query(`
                SELECT 
                    t.name
                    ,t.author
                    ,t.album
                    ,clc.popularity
                FROM gpsy.track_popularity_calc as clc
                    inner join gpsy.spotify_track as t
                        on clc.spotifyTrackId = t.trackId
                WHERE userId = ?
                ORDER BY clc.popularity desc
                LIMIT 1`, [user.id ? user.id : '']);
            let numberOfTracks = await entityManager.query(`
                SELECT 
                    count(distinct rt.spotifyTrackId) as 'tracksQuantity'
                FROM recently_played_tracks as rt
                WHERE rt.userId = ?
                `, [user.id ? user.id : ''])
            
            let numberOfPlaylists = await entityManager.query(`
            SELECT 
                count(distinct up.spotifyPlaylistId) as 'playlistQuantity'
            FROM user_playlist as up
            WHERE up.userId = ?`, [user.id ? user.id : '']);
            res.json({
                login: user.login,
                id: user.id,
                spotifyDirectLink: user.spotifyLink,
                from: user.registerDate,
                bestTrack: best ? best : '',
                trackQuantity: numberOfTracks[0] && numberOfTracks[0].tracksQuantity ? numberOfTracks[0].tracksQuantity : '',
                playlistQuantity: numberOfPlaylists[0] && numberOfPlaylists[0].playlistQuantity ? numberOfPlaylists[0].playlistQuantity : ''
            });
        } else {
            res.json(new ApiResponse(new ApiError(401, `User does not exist.`)));
        }     
    } catch(err) {
        res.json(new ApiResponse(new ApiError(12, 'Server Error. Try again later.')))
        console.error()
    }
})

/*
    ===============================================================================
    PATH: /allowSpotify
    METHOD: GET
    DESCRIPTION: Allows access to spotify data - executed only once, after registration
    ===============================================================================
*/
    app.get('/allow-spotify', auth.required, async (req: Request, res: Response) => {
        let loginFromToken = null
        try {
            let user = null;
            loginFromToken =  User.decodeJWT(getTokenFromHeaders(req)).login;
            user = await userRepository.findOne(loginFromToken);
            if(user && user.id) {
                res.json(new ApiResponse(new ApiSuccess(`Already joined your spotify account!`)));
                return;
            }
        } catch(err) {
            console.error(`[${new Date()}] Cannot join account`, err)
            res.json(new ApiResponse(new ApiError(99, `Cannot join your account now! Try later!`)));
            return;
        }

        const spotifyApi = new SpotifyWebApi({
            redirectUri: `${config.domain}/callback`,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET
          });
        TEMP_LOGIN_TO_USER_AUTH = loginFromToken; // ==> give the temp user login state to process
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
                        LOG.error('Cannot access user data: ', err);
                        res.json(new ApiResponse(new ApiError(20, `Cannot access user data`)));
                        return;
                    }
                
                    //save retrieved data of user
                    API_INSTANCES.set(TEMP_LOGIN_TO_USER_AUTH, [spotifyApi, new Date(), new Date(), new Date()]);
                    let userRepositoryFound:User = null;
                    let userWithSameSpotify: User = null;
                    try {
                        userRepositoryFound = await userRepository.findOne(TEMP_LOGIN_TO_USER_AUTH);
                        userWithSameSpotify = await userRepository.findOne({id: me.body.id ? me.body.id : '', 
                                                                            email: me.body.email ? me.body.email : '' })
                    } catch(err) {
                        LOG.error('Cannot access user data from db', err);
                        res.json(new ApiResponse(new ApiError(50, `Cannot access user data from db`)));
                        return;
                    }
                    if(userRepositoryFound && !userRepositoryFound.id && !userWithSameSpotify) {
                        userRepositoryFound.id =  me.body.id;
                        userRepositoryFound.email = me.body.email;
                        userRepositoryFound.name = me.body.display_name;
                        userRepositoryFound.spotifyRefreshToken = refresh_token;
                        userRepositoryFound.spotifyLink = me.body.external_urls && me.body.external_urls.spotify ? me.body.external_urls.spotify : '';
                        await userRepository.save(
                            userRepositoryFound
                        )
                        LOG.info(
                            `Spotify account assigned to ${me.body.email}! Sucessfully retreived access token for ${me.body.email}. Expires in ${expires_in} s.`
                        );
                        res.json(new ApiResponse(new ApiSuccess(`Success authorization to ${me.body.display_name}! Now you can close the window and explore the app!`)));
                        await SpotifyTracksRequestsService.retrieveUserRecentlyPlayed(userRepositoryFound, spotifyApi, spotifyTracksRepository, recentTracksRepository);
                        await SpotifyPlaylistRequestService.retrieveUserPlaylistsSheduler(userRepositoryFound, spotifyApi, userPlaylistRepository, spotifyTracksRepository);
                    } else if(!userRepositoryFound) {
                        res.json(new ApiResponse(new ApiError(401, `User does not exist.`)));
                    } else {
                        res.json(new ApiResponse(new ApiError(401, `You cannot assign the spotify account twice. The user ${userWithSameSpotify ? userWithSameSpotify.login : ''} has been assigned`)));
                    }
                    TEMP_LOGIN_TO_USER_AUTH = ''; // <== give the global variable the initial state
                })
                .catch(error => {
                    console.error('Error getting Tokens:', error);
                    res.json(new ApiResponse(new ApiError(11, `Error getting Tokens: ${error}`)));
                    TEMP_LOGIN_TO_USER_AUTH = ''; // <== give the global variable the initial state
                });
    });

/*
    ===============================================================================
    PATH: /spotify/played/now
    METHOD: GET
    DESCRIPTION: Gives propsals from gpsy, based on most frequently heard tracks
    ===============================================================================
*/
    app.get('/spotify/played/now', auth.required, async (req, res) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
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
    app.get('/spotify/proposals/top', auth.required, async(req, res) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
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
    app.get('/spotify/proposals', auth.required, async (req: Request, res: Response) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
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
    app.get('/gpsy/proposals', auth.required, async (req: Request, res: Response) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
        try {
            let user: User = await userRepository.findOne(decodedToken.login);
            if(user) {
                res.json(await recommendationService.recommendTracksFromGpsy(parseInt(req.query.limit), spotifyApi, user));
            } else {
                console.error(`[${new Date().toISOString()}] User ${decodedToken.login} not found in database`);
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
    app.get('/search/tracks', auth.required, async (req, res) => {
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
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
        let tracksNames = null;
        let tracksByArtist = null;
        try {
            tracksNames = await spotifyApi.searchTracks(req.query.phrase);
            if(tracksNames) {tracksNames = tracksNames.body.tracks.items.map(el => {
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
    app.get('/spotify/playlists', auth.required, async (req, res) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
        try {
            let user: User = await userRepository.findOne(decodedToken.login);
        
            if(user) {
                if(req.query.id) {
                   try {
                    let response = await SpotifyTracksRequestsService.retrieveUserPlaylistTracks(
                        req.query.id
                        ,user
                        ,spotifyApi
                        ,userPlaylistRepository
                        ,spotifyTracksRepository
                    )
                    res.json(response);

                   } catch(err) {
                        console.error(`[${new Date().toISOString()}] User ${decodedToken.login} tracks retrieve from playlist internal error`, err);
                        res.json(new ApiResponse(new ApiError(455, `Cannot retrieve the tracks properly. Try again later`)));  
                   }
                } else {
                    try {
                        let response = await SpotifyPlaylistRequestService.retrieveUserPlaylists(
                            user,
                            spotifyApi,
                            userPlaylistRepository
                        )
                        res.json(response);
                       } catch(err) {
                            console.error(`[${new Date().toISOString()}] User ${decodedToken.login} tracks retrieve from playlist internal error`, err);
                            res.json(new ApiResponse(new ApiError(455, `Cannot retrieve the tracks properly. Try again later`)));  
                       }
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${decodedToken.login} not found in database`);
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
    app.post('/spotify/playlists/track/add', auth.required, async (req, res) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
        try {
            let user: User = await userRepository.findOne(decodedToken.login);
            if(user) {
                try {
                let response = await SpotifyTracksRequestsService.addTracksToPlaylist(req.body.playlistId 
                                                                                ,req.body.tracks
                                                                                ,user
                                                                                ,spotifyApi
                                                                                ,userPlaylistRepository
                                                                                ,spotifyTracksRepository);
                if(response.status === 0 && response.info instanceof ApiSuccess) {
                    res.status(201);
                }
                res.json(response);
                } catch(err) {
                    console.error(`[${new Date().toISOString()}] User ${decodedToken.login} tracks add internal error`, err);
                    res.json(new ApiResponse(new ApiError(455, `Cannot add the tracks properly. Try again later`)));  
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${decodedToken.login} not found in database`);
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
    app.post('/spotify/playlists/add', auth.required, async (req, res) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
        try {
            let user: User = await userRepository.findOne(decodedToken.login);
            if(user) {
                try {
                    let response = await SpotifyPlaylistRequestService.addSpotifyPlaylist(
                        req.body.name
                        ,req.body.public
                        ,req.body.description ? req.body.description : ''
                        ,spotifyApi
                        ,user
                        ,userPlaylistRepository
                    )
                    if(response.status === 0 && response.info instanceof ApiSuccess) {
                        res.status(201);
                        res.json(response);
                    } else {
                        console.error(`[${new Date().toISOString()}] User ${decodedToken.login} internal error`);
                        res.json(response);
                    }
                } catch(err) {
                    console.error(`[${new Date().toISOString()}] User ${decodedToken.login} internal error`, err);
                    res.json(new ApiResponse(new ApiError(455, `Cannot add the playlist properly. Try again later`)));
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${decodedToken.login} not found in database`);
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
    app.get('/gpsy/playlists/recommend', auth.required, async (req, res) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];
        if(req.query.name && (req.query.name.length < 5 || req.query.name.length > 20)) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter, expected [name](type: string, length: min. 5, max 15)`)))
            return;
        }
        
        try {
            let user: User = await userRepository.findOne(decodedToken.login);
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
                        console.error(`[${new Date().toISOString()}] User ${decodedToken.login} problem with saving new rec. playlist`, err);
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
                    
                    if(apiResponse.status === 0 && apiResponse.info instanceof ApiSuccess) {

                        let gpsyRecommendations = apiResponse.info.data;
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
                            console.error(`[${new Date().toISOString()}] User ${decodedToken.login} cannot save new recommended playlist`, err);
                            res.json(new ApiResponse(new ApiError(460, `Cannot save recommended playlist! Internal error`)));
                        }
                    } else {
                        console.error(`[${new Date().toISOString()}] User ${decodedToken.login} problem with retrieving recommendations for playlist`);
                        res.json(new ApiResponse(new ApiError(460, `Cannot retrieve recommended tracks for playlist! Internal error`)));
                    }
                } catch(err) {
                    console.error(`[${new Date().toISOString()}] User ${decodedToken.login} problem with retrieving recommendations for playlist`, err);
                    res.json(new ApiResponse(new ApiError(460, `Cannot retrieve recommended tracks for playlist! Internal error`)));
                }
            } else {
                console.error(`[${new Date().toISOString()}] User ${decodedToken.login} not found in database`);
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
    app.post('/gpsy/playlists/send-actual', auth.required, async (req, res) => {
        let token = req.headers.authorization.split(' ');
        let decodedToken = User.decodeJWT(token[1]);
        let spotifyApi = API_INSTANCES.get(decodedToken.login)[0];  
        try {
            let user: User = await userRepository.findOne(decodedToken.login);
            if(user) {
                let playlist: RecommendedPlaylist = await recommentedPlaylistRepository.findOne({userId: user.id, actual: true})
                if(playlist) {
                    if(!playlist.sentToSpotify) {
                        try {
                            let response = await SpotifyPlaylistRequestService.addSpotifyPlaylist(
                                playlist.name
                                ,true
                                ,playlist.description ? playlist.description : ''
                                ,spotifyApi
                                ,user
                                ,userPlaylistRepository
                            )
                            if(response.status === 0 && response.info instanceof ApiSuccess) {
                                playlist.sentToSpotify = true;
                                playlist.sentToSpotifyDate = new Date();
                                playlist.spotifyPlaylistId = response.info.data.spotifyPlaylistId;
                                await recommentedPlaylistRepository.save(playlist);
                                res.status(201);
                            } else {
                                res.json(response);
                                return;
                            }
                            try {
                                let response = await SpotifyTracksRequestsService.addTracksToPlaylist(
                                    playlist.spotifyPlaylistId
                                    ,playlist.tracks
                                    ,user
                                    ,spotifyApi
                                    ,userPlaylistRepository
                                    ,spotifyTracksRepository
                                )
                                if(response.status === 0 && response.info instanceof ApiSuccess) {
                                    res.status(201);
                                    console.info(`[${new Date().toISOString()}] ${user.email} sent recommended playlist ${playlist.spotifyPlaylistId} to spotify`)
                                    res.json(new ApiResponse(new ApiSuccess(playlist)))
                                } else {
                                    res.json(response)
                                }
                            } catch(err) {
                                console.error(`[${new Date().toISOString()}] User ${decodedToken.login} tracks add internal error`, err);
                                res.json(new ApiResponse(new ApiError(455, `Cannot add the tracks properly. Try again later`)));
                            }
                        } catch(err) {
                            console.error(`[${new Date().toISOString()}] User ${decodedToken.login} playlist add internal error`, err);
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
                            let response = await SpotifyTracksRequestsService.addTracksToPlaylist(
                                playlist.spotifyPlaylistId
                                ,playlist.tracks
                                ,user
                                ,spotifyApi
                                ,userPlaylistRepository
                                ,spotifyTracksRepository
                            )
                            if(response.status === 0 && response.info instanceof ApiSuccess) {
                                res.status(201);
                            }
                            console.info(`[${new Date().toISOString()}] ${user.email} sent recommended tracks for ${playlist.spotifyPlaylistId} to spotify`)
                            res.json(response)
                        } catch(err) {
                            console.error(`[${new Date().toISOString()}] User ${decodedToken.login} tracks add internal error`, err);
                            res.json(new ApiResponse(new ApiError(455, `Cannot add the tracks properly. Try again later`)));
                        }
                    }
                } else {
                    console.error(`[${new Date().toISOString()}] Playlist ${req.query.name} not found in database`);
                    res.json(new ApiResponse(new ApiError(455, `Playlis not found. Make sure you have one!`)));
                }    
                
            } else {
                console.error(`[${new Date().toISOString()}] User ${decodedToken.login} not found in database`);
                res.json(new ApiResponse(new ApiError(455, `User not found. Make sure you are registered!`)));
            }
        } catch(err) {
            console.error('Something went wrong: ', err)
            res.json(new ApiResponse(new ApiError(450, `Something went wrong. Try again later`)));
        }
    });

    app.use(function (err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
          res.status(401).json(new ApiResponse(new ApiError(1, err.message)));
        }
      });
    // START EXPRESS APP
    app.listen(process.env.PORT || 8080, () => {
        LOG.info(`App listening at port ${process.env.PORT || 8080}`);
    });

}).catch(error => console.info(error));
