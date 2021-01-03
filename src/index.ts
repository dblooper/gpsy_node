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
dotenv.config();

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

const spotifyApi = new SpotifyWebApi({
  redirectUri: `${config.domain}/callback`,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

createConnection().then(async connection => {
    const userRepository = connection.getRepository(User);
    const spotifyTracksRepository = connection.getRepository(SpotifyTrack);
    const recentTracksRepository = connection.getRepository(RecentlyPlayedTracks);
    const entityManager = getManager();

    // create express app
    const app = express();
    app.use(bodyParser.json());

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

//START SPOTIFY AUTHORIZATION PROCESS
    app.get('/login', (req: Request, res: Response) => {
        res.redirect(spotifyApi.createAuthorizeURL(scopes));
    });

    app.get('/callback', (req: Request, res: Response) => {
    const error = req.query.error;
    const code = req.query.code;

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

        console.log('access_token:', access_token);
        console.log('refresh_token:', refresh_token);
        console.log(spotifyApi.getCredentials())
        console.log(
            `Sucessfully retreived access token. Expires in ${expires_in} s.`
        );

        setInterval(async () => {
            const data = await spotifyApi.refreshAccessToken();
            const access_token = data.body['access_token'];

            console.log('The access token has been refreshed!');
            console.log('access_token:', access_token);
            spotifyApi.setAccessToken(access_token);
        }, expires_in / 2 * 1000);
        
        //Start retrieving track listen data from spotify and save it to db
        setInterval(async () => {
            try {
                let recentTracks = await spotifyApi.getMyRecentlyPlayedTracks({
                    limit : 50
                });
                let me = await spotifyApi.getMe();
                // console.log(JSON.stringify(recentTracks, null, 1))
                console.log(`Recently played tracks for ${me.body.display_name} : ${
                    JSON.stringify(recentTracks.body.items.map(item => {return {name: item.track.name,
                                                                id: item.track.id,
                                                                playedAt: item.played_at}}), null, 1)
                }`);
                let user: User = await userRepository.findOne({email: me.body.email});
                if(user) {
                    let mappedTracks = [];
                    for(let item of recentTracks.body.items) {
                        let track: SpotifyTrack = await spotifyTracksRepository.findOne(item.track.id);
                        if(!track) {
                            track = await spotifyTracksRepository.save({trackId: item.track.id
                                                        , name: item.track.name
                                                        , author: item.track.artists[0].name
                                                        , authorId: item.track.artists[0].id
                                                        , album: item.track.album.name
                                                        , albumId: item.track.album.id})
                        }
                        let retDate = new Date(item.played_at);
                        retDate.setMilliseconds(Math.round(retDate.getMilliseconds()/1000) * 1000);
                        let inDb = await recentTracksRepository.findOne(
                            {userId: user.id,
                            spotifyTrackId: item.track.id,
                            playedAt: retDate}
                        )
                        
                        if(!inDb) {
                            mappedTracks.push({userId: user.id,
                                spotifyTrackId: item.track.id,
                                playedAt: new Date(item.played_at)})
                        }
                    }
                    if(mappedTracks) {
                        await recentTracksRepository.save(mappedTracks);
                    }
                } else {
                    
                }
            } catch(err) {
                console.log('Something went wrong when retrieving recently played', err);
            };
        }, 20000);

        let me = null;
        try {
            me = await spotifyApi.getMe();
        } catch(err) {    
            console.error('Cannot access user data: ', err);
            res.json(new ApiResponse(new ApiError(20, `Cannot access user data`)));
            return;
        }

        let userRepositoryFound = null;
        try {
            userRepositoryFound = await userRepository.findOne(me.body.id);
        } catch(err) {
            console.log('Cannot access user data from db: ' + err);
            res.json(new ApiResponse(new ApiError(50, `Cannot access user data from db`)));
            return;
        }

        if(!userRepositoryFound) {
            await userRepository.save({
                id: me.body.id,
                email: me.body.email,
                name: me.body.display_name,
                age: 18
            })
        }
        res.json(new ApiResponse(new ApiSuccess(`Success authorization to ${me.body.display_name}! You can now close the window`)));
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.json(new ApiResponse(new ApiError(11, `Error getting Tokens: ${error}`)));
        });
    });

    app.get('/played/now', (req, res) => {
        spotifyApi.getMyCurrentPlayingTrack()
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
                console.log(JSON.stringify(data.body,null,1))
            } else {
                res.json(new ApiResponse(new ApiSuccess('Nothing currently played')))
            }
        }, function(err) {
            console.error('Something went wrong!', err);
            res.json(new ApiResponse(new ApiError(10, `User not logged in`)));
        });
    });

    app.get('/proposals/spotify', async (req: Request, res: Response) => {
        if(req.query.length === 0 || !req.query.limit) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter, expected "limit"(type: int)`)))
            return;
        } else if(parseInt(req.query.limit) < 1 || parseInt(req.query.limit ) > 20 ) {
            res.json(new ApiResponse(new ApiError(400, `Wrong parameter input, expected integer <1;20>`)))
            return;
        }
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

        spotifyApi.getRecommendations({
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

//STOP SPOTIFY AUTHORIZATION PROCESS

    // start express server
    app.listen(8080);

    console.log("App started");

}).catch(error => console.log(error));
