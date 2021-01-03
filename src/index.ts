import "reflect-metadata";
import {createConnection} from "typeorm";
import {getRepository} from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import {Request, Response} from "express";
import {Routes} from "./routes";
import {User} from "./entity/User";

/**
 * This example is using the Authorization Code flow.
 *
 * In root directory run
 *
 *     npm install express
 *
 * then run with the followinng command. If you don't have a client_id and client_secret yet,
 * create an application on Create an application here: https://developer.spotify.com/my-applications to get them.
 * Make sure you whitelist the correct redirectUri in line 26.
 *
 *     node access-token-server.js "<Client ID>" "<Client Secret>"
 *
 *  and visit <http://localhost:8888/login> in your Browser.
 */
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
  redirectUri: 'http://localhost:8080/callback',
  clientId: 'cabce243b2e7482cbaf0dc2c6f88a78b',
  clientSecret: 'e92ce3f2921f46f0ae3d3c4cb894b2b5'
});

createConnection().then(async connection => {
    const userRepository = connection.getRepository(User);
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

    app.get('/login', (req, res) => {
        res.redirect(spotifyApi.createAuthorizeURL(scopes));
    });

    app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
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

        const me = await spotifyApi.getMe();
        console.log(me);
        let userFound = await userRepository.findOne(me.id);
        if(!userFound) {
            await userRepository.save({
                id: me.body.id,
                email: me.body.email,
                name: me.body.display_name,
                age: 18
            })
        }
        res.send(`Success! You can now close the window. We have all :) your data ${JSON.stringify(me)}`);
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
        });
    });

    app.get('/info', (req, res) => {
        spotifyApi.getMyCurrentPlayingTrack()
        .then(function(data) {
            res.send(JSON.stringify(data));
        }, function(err) {
            console.log('Something went wrong!', err);
            res.send('Please login first!')
        });
        
    })
    // start express server
    app.listen(8080);

    console.log("App started");

}).catch(error => console.log(error));
