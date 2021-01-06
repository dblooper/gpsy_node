import { SpotifyTrack } from "../entity/SpotifyTrack";
import { User } from "../entity/User";
import { UserPlaylist } from "../entity/UserPlaylist";
import { SpotifyRequestsService } from "../service/SpotifyRequestsService";

export class Scheduler {
    public static SCHEDULER_HEART_BEAT_S: number = 2;
    //public static SCHEDULER_HEART_BEAT_S: number = 3;
    public static TOKEN_REFRESH_TIME_S: number = 3300; //3600s expiration
    //public static TOKEN_REFRESH_TIME_S: number = 4;
    public static RETRIEVE_TRACKS_TIME_S: number = 6000; //approx. 2min per track/ 50 tracks
    //public static RETRIEVE_TRACKS_TIME_S: number = 6; //approx. 2min per track/ 50 tracks
    public static RETRIEVE_PLAYLISTS_TIME_S: number = 1800; //half an hour
    private static LOG_DATE = new Date();
    static scheduleTokenAndRecetTracks = async (recentTracksRepository, userRepository,spotifyTracksRepository, userPlaylistRepository, apiInstances: Map<String, [any, Date, Date, Date]>) => {
        let schedulingFunction = async () => {
            if(Math.abs(Scheduler.LOG_DATE.getTime() - new Date().getTime()) > 60000) {
                console.info(`[${new Date().toISOString()}] Scheduler working!`);
                Scheduler.LOG_DATE = new Date();
            }
            for(let entry of apiInstances.entries()) {
                let key = entry[0];
                let value = entry[1];
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
                        console.info(`[${new Date().toISOString()}] SCHEDULER: ${me.body.email} token refreshed!`);
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
                                                                , albumId: item.track.album.id
                                                                , durationMs: item.track.duration_ms
                                                                 })
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
                            console.info(`[${new Date().toISOString()}] SCHEDULER:  ${user.email} Recently played tracks fetched successfully`);
                        } else {
                            console.info(`[${new Date().toISOString()}] SCHEDULER: User does not exists ${me.body.email}`);
                            return;
                        }
                    } catch(err) {
                        console.error(`[${new Date().toISOString()}] SCHEDULER: Something went wrong when retrieving recently played`, err);
                    }
                }

                //REFRESH USER PLAYLISTS
                if(new Date().getTime() - value[3].getTime() > Scheduler.RETRIEVE_PLAYLISTS_TIME_S * 1000) { 
                    try {
                        let user: User = await userRepository.findOne(key);
                        let playlists: UserPlaylist[] = await userPlaylistRepository.find({userId: user.id});
                        for(let playlist of playlists) {
                            SpotifyRequestsService.retrieveUserPlaylistTracks(playlist.spotifyPlaylistId
                                ,user
                                ,spotifyApi
                                ,userPlaylistRepository
                                ,spotifyTracksRepository
                                )
                        }
                        value[3] = new Date();
                        console.info(`[${new Date().toISOString()}] SCHEDULER: ${user.email} Playlists refreshed successfully`)
                    } catch(err) {
                        console.error(`[${new Date().toISOString()}] SCHEDULER: Something went wrong when retrieving playlists`, err);
                    }
                }
            }
        }
        await schedulingFunction();
        setInterval(schedulingFunction, Scheduler.SCHEDULER_HEART_BEAT_S * 1000)
    } 
}

