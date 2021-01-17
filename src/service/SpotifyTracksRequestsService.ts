import { ApiError } from "../apiResponse/ApiError";
import { ApiResponse } from "../apiResponse/ApiResponse";
import { ApiSuccess } from "../apiResponse/ApiSuccess";
import { SpotifyTrack } from "../entity/SpotifyTrack";
import { UserPlaylist } from "../entity/UserPlaylist";
import { GendresDbRequests } from "../repository/GendresDbRequests";
import {factory} from '../config/LoggerConfig'

export default class SpotifyTracksRequestsService {

    static LOG = factory.getLogger('SpotifyTracksRequestsService');
    
    public static retrieveUserRecentlyPlayed = async (user, spotifyApi, spotifyTracksRepository, recentTracksRepository ) => {
        try {
            let recentTracks = await spotifyApi.getMyRecentlyPlayedTracks({
                limit : 50
            });
            if(user) {
                let mappedTracks = [];
                for(let item of recentTracks.body.items) {
                    try {
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
                    } catch(err) {
                        SpotifyTracksRequestsService.LOG.error(`Something went wrong when retrieving recently played`, err)
                    }
                }
                if(mappedTracks) {
                    await recentTracksRepository.save(mappedTracks);
                }
                
                SpotifyTracksRequestsService.LOG.info(`${user.email} Recently played tracks fetched successfully`);
                return new Date();
            } else {
                SpotifyTracksRequestsService.LOG.info(`User does not exists ${user.email}`);
                return;
            }
        } catch(err) {
            SpotifyTracksRequestsService.LOG.error(`Something went wrong when retrieving recently played`, err);
            return new Date();
        }
     }

    public static addTracksToPlaylist = async (providedPlaylistId, providedTracks, user, spotifyApi, userPlaylistRepository, spotifyTracksRepository) => {
        if(typeof providedPlaylistId !== 'string') {
            return new ApiResponse(new ApiError(300, 'Invalid playlist id!'))
        }
        let playlist: UserPlaylist = await userPlaylistRepository.findOne({userId: user.id, spotifyPlaylistId: `${providedPlaylistId}`})
        if(playlist) { 
            let responseMessage = {success: [], failed: []}
            for(let track of providedTracks) {
                try {
                    let dbTrack: SpotifyTrack = await spotifyTracksRepository.findOne(track.trackId);
                    if(dbTrack) {
                        if(!playlist.tracks) {
                            playlist.tracks = []; 
                        }
                        if(playlist.tracks.find((el) => el.trackId === track.trackId)) {
                            track.cause = "Track already exists"
                            responseMessage.failed.push(track); 
                        } else {
                            playlist.tracks.push(dbTrack);
                            responseMessage.success.push(track);
                        }         
                    } else {
                        track.cause = "Track not found"
                        responseMessage.failed.push(track); 
                    }
                } catch(err) {
                    SpotifyTracksRequestsService.LOG.error(` Track ${track.trackId} not found`, err)
                    track.cause = "Track internal search error"
                    responseMessage.failed.push(track);
                }
            }
            
            try {
                if(responseMessage.success.length) {
                    let spotifyMapTracks = responseMessage.success.map(el => `spotify:track:${el.trackId}`);
                    await spotifyApi.addTracksToPlaylist(playlist.spotifyPlaylistId, spotifyMapTracks);
                }
                try {
                    if(responseMessage.success.length) {
                        await userPlaylistRepository.save(playlist);
                        SpotifyTracksRequestsService.LOG.info(` ${user.email} added tracks to playlist ${playlist.spotifyPlaylistId}`)
                    }
                    return (new ApiResponse(new ApiSuccess(responseMessage)));
                } catch(err){
                    SpotifyTracksRequestsService.LOG.error(` Saving tracks to playlist ${playlist.spotifyPlaylistId} db failed`);
                    return(new ApiResponse(new ApiError(455, `Saving failed, try again later`)));
                }
            } catch(err) {
                SpotifyTracksRequestsService.LOG.error(`Playlist ${providedPlaylistId} sending error to spotify`, err);
                return(new ApiResponse(new ApiError(455, `Sending elements to spotify error`)));
            }
        } else {
            SpotifyTracksRequestsService.LOG.error(`Playlist ${providedPlaylistId} not found in database`);
            return(new ApiResponse(new ApiError(455, `Playlist not found. Make sure you have this one!`)));
        }
    }

    public static retrieveUserPlaylistTracks = async(playlistSpotifyId, user, spotifyApi, userPlaylistRepository, spotifyTracksRepository ) => {
        try {
            let response = await spotifyApi.getPlaylist(playlistSpotifyId);
            let tracksFetched = response.body.tracks.items.map(el => {return{
                trackId: el.track.id,
                name: el.track.name,
                author: el.track.artists[0].name,
                authorId: el.track.artists[0].id,
                album: el.track.album.name,
                albumId: el.track.album.id,
                durationMs: el.track.duration_ms
            }});
            let playlist = {
                userId: user.id,
                spotifyPlaylistId: response.body.id,
                name: response.body.name,
                description: response.body.description,
                tracks: tracksFetched
            }
            let playlistExisting = await userPlaylistRepository.findOne(playlist.spotifyPlaylistId);

            if(playlistExisting && playlist && playlist.tracks.length) {
                for(let tracktoDelete of playlistExisting.tracks) {
                    if(!playlist.tracks.find(el => el.trackId === tracktoDelete.trackId)) {
                        playlistExisting.tracks.splice(playlistExisting.tracks.indexOf(tracktoDelete), 1);
                    }
                }
                for(let track of playlist.tracks) {
                    if(track && playlistExisting.tracks && !playlistExisting.tracks.find(el => el.trackId === track.trackId)) {
                        try {
                            let trackInDb = await spotifyTracksRepository.findOne(track.trackId);
                            if(trackInDb) {
                                playlistExisting.tracks.push(trackInDb);
                            } else {
                                await spotifyTracksRepository.save(track);
                                playlistExisting.tracks.push(track);
                            }
                        } catch(err) {
                            SpotifyTracksRequestsService.LOG.error(` Cannot retrieve track from db`, err)
                            return(new ApiResponse(new ApiError(500, `Internal error. Try again later`)))
                        }
                    }
                    
                }
                try {
                    await userPlaylistRepository.save(playlistExisting);
                    SpotifyTracksRequestsService.LOG.info(`Playlist ${playlistExisting.spotifyPlaylistId} state saved`)
                } catch(err) {
                    SpotifyTracksRequestsService.LOG.error(`Playlist ${playlistExisting.spotifyPlaylistId} state saving error`, err)
                }
            } else if(playlist) {
                try {
                    let tracksToSave = [];
                    for(let track of playlist.tracks) {
                        let trackInDb = await spotifyTracksRepository.findOne(track.trackId);
                        if(!trackInDb) {
                            tracksToSave.push(track);
                        }
                    }
                    await spotifyTracksRepository.save(tracksToSave);
                    await userPlaylistRepository.save(playlist);
                    SpotifyTracksRequestsService.LOG.info(`Playlist ${playlistExisting.spotifyPlaylistId} state saved`)
                } catch(err) {
                    SpotifyTracksRequestsService.LOG.error(`Playlist ${playlist.spotifyPlaylistId} state saving error`, err)
                }
            }
           return(new ApiResponse(new ApiSuccess(playlist)))
        } catch(err) {
            SpotifyTracksRequestsService.LOG.error(`Playlist ${playlistSpotifyId} not found for ${user.email}`, err)
            return(new ApiResponse(new ApiError(50, `Playlist not found!`)))
        }
    }

    static refreshGendres = async (spotifyApi, trakcRepository, genresRepository) => {
        let tracks: SpotifyTrack[] = await trakcRepository.find({genres: ''});
        if(tracks.length) {
            for(let track of tracks) {
                try {
                    let aritstDetails = await spotifyApi.getArtist(track.authorId);
                    let genresRetrieved = [];                
                    if(aritstDetails && aritstDetails.body && aritstDetails.body.genres) {
                        genresRetrieved = aritstDetails.body.genres
                    }
                    if(genresRetrieved.length) {
                        track.genres = genresRetrieved.join('#');
                        await trakcRepository.save(track);
                        await GendresDbRequests.saveGendresFromTrack(track, genresRetrieved, genresRepository);
                        SpotifyTracksRequestsService.LOG.info(`Track ${track.trackId} genres ${genresRetrieved} updated`);
                    }
                }catch(err) {
                    SpotifyTracksRequestsService.LOG.error(`Something went wrong updating track gendres`, err)
                    let myDate = new Date(new Date().getTime() + 5000);
                    while(new Date() < myDate) {
                    }
                }
            }
         }
     }

}