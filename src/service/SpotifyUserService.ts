import SpotifyWebApi from "spotify-web-api-node";
import { User } from "../entity/User";
import config from '../../config.json';
import { Scheduler } from "../sheduler/Sheduler";
import { exit } from "process";
import { SpecialCasesHandler } from "../config/SpecialCasesHandler";

export class SpotifyUserService {

    static async retrieveSpotifyUsersSavedToDb(userRepository) {
        if(! await SpecialCasesHandler.hasInternetConnection()) {
            return;
        }

        let apiInstances = new Map<String, [any, Date, Date, Date]>();
        let users: User[] = await userRepository.find();
        if(users) {
            let intervalDate: number = 0;
            let spotifyUsers: User[] = users.filter(el => el.id);
            for(let user of spotifyUsers) {
                let spotApi = new SpotifyWebApi({
                    redirectUri: `${config.domain}/callback`,
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET
                  });
                    spotApi.setRefreshToken(user.spotifyRefreshToken);
                try {
                    const data = await spotApi.refreshAccessToken();
                    const access_token = data.body['access_token'];
                    spotApi.setAccessToken(access_token);
                    const me = await spotApi.getMe();
                    console.info(`[${new Date().toISOString()}] ${me.body.email} token refreshed!`);
                    let lastDateRefreshToken = new Date(new Date().getTime() + intervalDate);
                    let lastDateReceivedRecentTracks = new Date((new Date().getTime() + intervalDate) - (Scheduler.RETRIEVE_TRACKS_TIME_S*1000 + 3600000));
                    let lastDateReceivedPlaylists = new Date((new Date().getTime() + intervalDate) - (Scheduler.RETRIEVE_PLAYLISTS_TIME_S*1000 + 3600000))
                    intervalDate += 1000;
                    apiInstances.set(user.login, [spotApi, lastDateRefreshToken, lastDateReceivedRecentTracks, lastDateReceivedPlaylists]);  
                }catch(err) {
                    console.error(`[${new Date()}] Something went wrong with spotify data`, err)
                }
            }
        }
        return apiInstances;
    }

    static async refreshUserDataFromSpotify (login, spotifyApi, userRepository) {
        if(! await SpecialCasesHandler.hasInternetConnection()) {
            return;
        }

        let user: User = await userRepository.findOne(login);
        if(user) {
            let spotifyUser = await spotifyApi.getMe();
            if(spotifyUser) {
                if(spotifyUser.body.images[0] && spotifyUser.body.images[0].url && user.spotifyImageUrl !== spotifyUser.body.images[0].url) {
                    user.spotifyImageUrl = spotifyUser.body.images[0].url;
                    userRepository.save(user);
                    console.log('done');
                }
            }
        }
    }

    static refreshUserToken = async (spotifyApi, user: User) => {
        try {
            const data = await spotifyApi.refreshAccessToken();
            const access_token = data.body['access_token'];
            spotifyApi.setAccessToken(access_token);
            console.info(`[${new Date().toISOString()}] SCHEDULER: ${user.email ? user.email : 'user'} token refreshed!`);
            return new Date();
        }catch(err) {
            console.error(`Not refreshed token for ${user.email ? user.email : 'user'}`, err)
            return null;
        }
     }
}