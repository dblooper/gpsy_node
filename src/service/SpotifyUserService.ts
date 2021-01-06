import SpotifyWebApi from "spotify-web-api-node";
import { User } from "../entity/User";
import config from '../../config.json';
import { Scheduler } from "../sheduler/Sheduler";

export class SpotifyUserService {

    static async retrieveSpotifyUsersSavedToDb(userRepository) {
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
            }
        }
        return apiInstances;
    }

}