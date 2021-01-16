import { SpotifyTrack } from "../entity/SpotifyTrack";
import { TrackGeneres } from "../entity/TrackGenres";


export class GendresDbRequests {

    static saveGendresFromTrack = async (track:SpotifyTrack, genresRetrieved, genresRepository) => {
        let genres = new TrackGeneres();
        genres.trackId = track.trackId;
        genres.genre1 = (genresRetrieved[0] && genresRetrieved[0].length) ? genresRetrieved[0] : '';
        genres.genre2 = (genresRetrieved[1] && genresRetrieved[1].length) ? genresRetrieved[1] : '';
        genres.genre3 = (genresRetrieved[2] && genresRetrieved[2].length) ? genresRetrieved[2] : '';
        genres.genre4 = (genresRetrieved[3] && genresRetrieved[3].length) ? genresRetrieved[3] : '';
        genres.genre5 = (genresRetrieved[4] && genresRetrieved[4].length) ? genresRetrieved[4] : '';
        genres.genre6 = (genresRetrieved[5] && genresRetrieved[5].length) ? genresRetrieved[5] : '';
        genres.genre7 = (genresRetrieved[6] && genresRetrieved[6].length) ? genresRetrieved[6] : '';
        genres.genre8 = (genresRetrieved[7] && genresRetrieved[7].length) ? genresRetrieved[7] : '';
        genres.genre9 = (genresRetrieved[8] && genresRetrieved[8].length) ? genresRetrieved[8] : '';
        genres.genre10 = (genresRetrieved[9] && genresRetrieved[9].length) ? genresRetrieved[9] : '';
        try {
            await genresRepository.save(genres);
        } catch(err) {
            console.error(`[${new Date().toISOString()}] GENDRES_REPO: problem with gendres saving`, err)
        }
    }
}