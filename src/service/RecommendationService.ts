import { ApiError } from "../apiResponse/ApiError";
import { ApiResponse } from "../apiResponse/ApiResponse";
import { ApiSuccess } from "../apiResponse/ApiSuccess";
import { User } from "../entity/User";

export class RecommendationService {

    private entityManager;
    private firstRun: boolean = true;
    private sqlProcedureCalc: string = 'call calc_track_popularity;' 

    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    recommendTracksFromGpsy = async (limit: number, spotifyApi: any, user:User) => {
        let mostFrequent = null;
        try {
            mostFrequent = await this.entityManager.query(
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
                limit 5`, [user.id ? user.id : '']
            )
        } catch(err) {
            console.error('[${new Date().toISOString()}] Something went wrong!', err);
            return new ApiResponse(new ApiError(450, `Cannot get recommendation. Internal Error`)); //TODO napisac ze problem z baza
        }
        mostFrequent = mostFrequent.map(el => el.spotifyTrackId);
        try {
            let data = await spotifyApi
                    .getRecommendations({
                        seed_tracks: mostFrequent,
                        limit: limit,
                        min_popularity: 60
                    });
            let recommendations = data.body.tracks;
            return (new ApiResponse(
                                new ApiSuccess(recommendations
                                                    .map(el => {
                                                        return {
                                                            trackId: el.id
                                                                , name: el.name
                                                                , author: el.artists[0].name
                                                                , authorId:  el.artists[0].id
                                                                , album:  el.album.name
                                                                , albumId:  el.album.id
                                                                , durationMs:  el.duration_ms}}))))
        } catch(err) {
            console.error('[${new Date().toISOString()}] Something went wrong!', err);
            return (new ApiResponse(new ApiError(10, `User not logged in`)));
        }
    }

    calculateGpsyPopularTracks = async() => {
        try {
            if(this.firstRun) {
                let queryResult = await this.entityManager.query(
                    this.sqlProcedureCalc
                )
                console.info(`[${new Date().toISOString()}] Message from popularity calc ${JSON.stringify(queryResult)}`);
            }
            
        } catch(err) {
            console.error('[${new Date().toISOString()}] Something went wrong!', err);
            return new ApiResponse(new ApiError(450, `Cannot get recommendation. Internal Error`)); //TODO napisac ze problem z baza
        }
    }

}