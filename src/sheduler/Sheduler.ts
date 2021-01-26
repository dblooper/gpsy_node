import { SpecialCasesHandler } from "../config/SpecialCasesHandler";
import { SpotifyTrack } from "../entity/SpotifyTrack";
import { TrackGenres } from "../entity/TrackGenres";
import { User } from "../entity/User";
import { UserPlaylist } from "../entity/UserPlaylist";
import { SpotifyPlaylistRequestService } from "../service/SpotifyPlaylistRequestService";
import SpotifyTracksRequestsService from "../service/SpotifyTracksRequestsService";
import { SpotifyUserService } from "../service/SpotifyUserService";

export class Scheduler {
    public static SCHEDULER_HEART_BEAT_S: number = 2;
    //public static SCHEDULER_HEART_BEAT_S: number = 3;
    public static TOKEN_REFRESH_TIME_S: number = 3400; //3600s expiration
    //public static TOKEN_REFRESH_TIME_S: number = 4;
    public static RETRIEVE_TRACKS_TIME_S: number = 6000; //approx. 2min per track/ 50 tracks
    //public static RETRIEVE_TRACKS_TIME_S: number = 6; //approx. 2min per track/ 50 tracks
    public static RETRIEVE_PLAYLISTS_TIME_S: number = 1800; //half an hour

    private static LAST_CALC_POPULARITY_DATE: Date = null;
    private static LAST_GENRES_REFRESH: Date = null;
    private static CALC_POPULARITY_INTERVAL_S: number = 300;
    private static GENRES_REFRESH_INTERVAL_S: number = 300;
    private static LOG_DATE = new Date();

    static scheduleTokenAndRecetTracks = async (recentTracksRepository, userRepository,spotifyTracksRepository, userPlaylistRepository, apiInstances: Map<String, [any, Date, Date, Date]>, recommendationService, connection) => {
        let generesRepository = connection.getRepository(TrackGenres);
        let schedulingFunction = async () => {
            if(!await SpecialCasesHandler.hasInternetConnection()) {
                console.error(`[${new Date().toISOString()}] SCHEDULER: No internet connection!`);
                return;
            }

            if(Math.abs(Scheduler.LOG_DATE.getTime() - new Date().getTime()) > 60000) {
                console.info(`[${new Date().toISOString()}] SCHEDULER: Working!`);
                Scheduler.LOG_DATE = new Date();
            }
            for(let entry of apiInstances.entries()) {
                let key = entry[0];
                let value = entry[1];
                let spotifyApi = value[0];
                let user: User = await userRepository.findOne(key);
                //REFRESH TOKEN
                if(new Date().getTime() - value[1].getTime() > Scheduler.TOKEN_REFRESH_TIME_S * 1000) { 
                    let date = await SpotifyUserService.refreshUserToken(spotifyApi, user);
                    value[1] = date;
                }

                //RETRIEVE RECENTLY PLAYED
                if(new Date().getTime() - value[2].getTime() > Scheduler.RETRIEVE_TRACKS_TIME_S * 1000){ 
                        let datePast = new Date(value[2]);
                    try {
                        //REFRESH USER DATA
                        await SpotifyUserService.refreshUserDataFromSpotify(key, spotifyApi, userRepository);
                        let date = await SpotifyTracksRequestsService.retrieveUserRecentlyPlayed(user, spotifyApi, spotifyTracksRepository, recentTracksRepository);
                        value[2] = date;
                    } catch {
                        value[2] = datePast;
                    }
                }

                //REFRESH USER PLAYLISTS
                if(new Date().getTime() - value[3].getTime() > Scheduler.RETRIEVE_PLAYLISTS_TIME_S * 1000) { 
                        let datePast = new Date(value[2]);
                    try {
                        let date = await SpotifyPlaylistRequestService.retrieveUserPlaylistsSheduler(user, spotifyApi, userPlaylistRepository, spotifyTracksRepository);
                        value[3] = date;
                    } catch(err) {
                        value[3] = datePast
                    }
                }
            }

            //REFRESH GENRES
            if(!Scheduler.LAST_GENRES_REFRESH) {
                let spotifyApi = apiInstances.entries().next().value[1][0];
                await SpotifyTracksRequestsService.refreshGendres(spotifyApi, spotifyTracksRepository, generesRepository);
                Scheduler.LAST_GENRES_REFRESH = new Date();
            } else if((new Date().getTime() - Scheduler.LAST_GENRES_REFRESH.getTime()) > Scheduler.GENRES_REFRESH_INTERVAL_S * 1000) {
                let spotifyApi = apiInstances.entries().next().value[1][0];
                await SpotifyTracksRequestsService.refreshGendres(spotifyApi, spotifyTracksRepository, generesRepository);
                Scheduler.LAST_GENRES_REFRESH = new Date();
            }

            //DIRECT DB CALCS
            if(!Scheduler.LAST_CALC_POPULARITY_DATE) {
                await recommendationService.calculateGpsyPopularTracks();
                Scheduler.LAST_CALC_POPULARITY_DATE = new Date();
            } else if((new Date().getTime() - Scheduler.LAST_CALC_POPULARITY_DATE.getTime()) > Scheduler.CALC_POPULARITY_INTERVAL_S * 1000) {
                await recommendationService.calculateGpsyPopularTracks();
                Scheduler.LAST_CALC_POPULARITY_DATE = new Date();
            }
        }
        await schedulingFunction();
        setInterval(schedulingFunction, Scheduler.SCHEDULER_HEART_BEAT_S * 1000)
     }

}

