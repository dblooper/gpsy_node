import { SpotifyTrack } from "../entity/SpotifyTrack";
import { User } from "../entity/User";

export class Scheduler {
    public static SCHEDULER_HEART_BEAT_S: number = 2;
    //public static SCHEDULER_HEART_BEAT_S: number = 3;
    public static TOKEN_REFRESH_TIME_S: number = 3300; //3600s expiration
    //public static TOKEN_REFRESH_TIME_S: number = 4;
    public static RETRIEVE_TRACKS_TIME_S: number = 6000; //approx. 2min per track/ 50 tracks
    //public static RETRIEVE_TRACKS_TIME_S: number = 6; //approx. 2min per track/ 50 tracks
    private static LOG_DATE = new Date();
    static scheduleTokenAndRecetTracks = (recentTracksRepository, userRepository,spotifyTracksRepository, apiInstances: Map<String, [any, Date, Date]>) => {
        setInterval(async () => {
            if(Scheduler.LOG_DATE.getTime() - new Date().getTime() > 60) {
                console.info(`[${new Date().toISOString()}] Scheduler working!`);
            }
            apiInstances.forEach(async (value, key, map) => {
                let spotifyApi = value[0];
    
                //REFRESH TOKEN
                if(new Date().getTime() - value[1].getTime() > Scheduler.TOKEN_REFRESH_TIME_S * 1000) { 
                    let me = null
                    try {
                        me = await spotifyApi.getMe();
                    } catch(err) {
                        console.error(`Retrieve tracks err: user cannot be retrieved`, err)
                    }
                    try {
                        value[1] = new Date();
                        const data = await spotifyApi.refreshAccessToken();
                        const access_token = data.body['access_token'];
                        spotifyApi.setAccessToken(access_token);
                        console.info(`[${new Date().toISOString()}] ${me.body.email} token refreshed!`);
                    }catch(err) {
                        console.error(`Not refreshed token for ${me.body.email}`, err)
                    }
                }
                //RETRIEVE RECENTLY PLAYED
                if(new Date().getTime() - value[2].getTime() > Scheduler.RETRIEVE_TRACKS_TIME_S * 1000){ 
                    try {
                        let recentTracks = await spotifyApi.getMyRecentlyPlayedTracks({
                            limit : 50
                        });
                        let me = await spotifyApi.getMe();
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
                            value[2] = new Date();
                            console.info(`Recently played tracks for ${me.body.display_name} fetched successfully`);
                        } else {
                            let message = `User does not exists ${me.body.email}`
                            console.info(message);
                            return;
                        }
                    } catch(err) {
                        console.info('Something went wrong when retrieving recently played', err);
                    };
                }
            })
        }, Scheduler.SCHEDULER_HEART_BEAT_S * 1000)
    } 
}

