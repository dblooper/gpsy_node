import { ApiError } from "../apiResponse/ApiError";
import { ApiResponse } from "../apiResponse/ApiResponse";
import { ApiSuccess } from "../apiResponse/ApiSuccess";
import { SpotifyTrack } from "../entity/SpotifyTrack";
import { User } from "../entity/User";
import { UserPlaylist } from "../entity/UserPlaylist";

export class SpotifyRequestsService {

    public static addSpotifyPlaylist = async(providedName: String, providedPublic, providedDesc, spotifyApi: any, user: User, userPlaylistRepository) => {

        let playlist: UserPlaylist = await userPlaylistRepository.findOne({userId: user.id, name: providedName})
                if(!playlist && providedName) { 
                    try {
                        let createdPlaylist = await spotifyApi
                                                        .createPlaylist(providedName, 
                                                                        {'description': providedDesc ? providedDesc : '',
                                                                        'public': providedPublic === 'false' ? false : true 
                        });
                        if(createdPlaylist.statusCode === 201) {
                            let newPlaylist = {
                                userId: user.id,
                                spotifyPlaylistId: createdPlaylist.body.id,
                                name: createdPlaylist.body.name,
                                description: createdPlaylist.body.description,
                                public: createdPlaylist.body.public
                            }
                            await userPlaylistRepository.save(newPlaylist);
                            console.info(`[${new Date().toUTCString()}] New playlist ${newPlaylist.spotifyPlaylistId} created by ${user.email}`)
                            return (new ApiResponse(new ApiSuccess(newPlaylist)));
                      } else {
                        console.error(`[${new Date().toISOString()}] ${user.id} Playlist ${providedName} not created`);
                        return (new ApiResponse(new ApiError(455, `Playlist not created! Spotify service error`)));  
                      }
                    } catch(err) {
                        console.error(`[${new Date().toISOString()}] Playlist ${providedName} not created`, err)
                        return (new ApiResponse(new ApiError(455, `Playlist not created! Internal Error`)));
                    }   
                } else {
                    console.error(`[${new Date().toISOString()}] Playlist ${providedName} found in database`);
                    return (new ApiResponse(new ApiError(455, `Playlist found. Change playlist name and try again!`)));
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
                    console.error(`[${new Date().toISOString()}] Track ${track.trackId} not found`, err)
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
                        console.info(`[${new Date().toISOString()}] ${user.email} added tracks to playlist ${playlist.spotifyPlaylistId}`)
                    }
                    return (new ApiResponse(new ApiSuccess(responseMessage)));
                } catch(err){
                    console.error(`[${new Date().toISOString()}] Saving tracks to playlist ${playlist.spotifyPlaylistId} db failed`);
                    return(new ApiResponse(new ApiError(455, `Saving failed, try again later`)));
                }
            } catch(err) {
                console.error(`[${new Date().toISOString()}] Playlist ${providedPlaylistId} sending error to spotify`, err);
                return(new ApiResponse(new ApiError(455, `Sending elements to spotify error`)));
            }
        } else {
            console.error(`[${new Date().toISOString()}] Playlist ${providedPlaylistId} not found in database`);
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
                            console.error(`[${new Date().toISOString()}] Cannot retrieve track from db`, err)
                            return(new ApiResponse(new ApiError(500, `Internal error. Try again later`)))
                        }
                    }
                    
                }
                try {
                    await userPlaylistRepository.save(playlistExisting);
                    console.info(`[${new Date().toISOString()}] Playlist ${playlistExisting.spotifyPlaylistId} state saved`)
                } catch(err) {
                    console.error(`[${new Date().toISOString()}] Playlist ${playlistExisting.spotifyPlaylistId} state saving error`, err)
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
                    console.info(`[${new Date().toISOString()}] Playlist ${playlistExisting.spotifyPlaylistId} state saved`)
                } catch(err) {
                    console.error(`Playlist ${playlist.spotifyPlaylistId} state saving error`, err)
                }
            }
           return(new ApiResponse(new ApiSuccess(playlist)))
        } catch(err) {
            console.error(`[${new Date().toISOString()}] Playlist ${playlistSpotifyId} not found for ${user.email}`, err)
            return(new ApiResponse(new ApiError(50, `Playlist not found!`)))
        }
    }

    public static retrieveUserPlaylists = async (user, spotifyApi, userPlaylistRepository) => {
        let response = await spotifyApi.getUserPlaylists(user.id);
        let playlists = response.body.items.map(el => {
            return {
                userId: user.id,
                spotifyPlaylistId: el.id,
                name: el.name,
                description: el.description
            }})
        let playlistsExisting: UserPlaylist[] = await userPlaylistRepository.find({userId: user.id});
        let newPlaylists = [];
        let toDeletePlaylists = [];
        for(let playlist of playlists) {
            let newPlaylist = true;
            for(let dbPlaylist of playlistsExisting) {
                if(dbPlaylist.spotifyPlaylistId === playlist.spotifyPlaylistId && 
                    dbPlaylist.userId === playlist.userId && dbPlaylist.name === playlist.name && dbPlaylist.description === playlist.description) {
                        newPlaylist = false;
                    } else if(dbPlaylist.spotifyPlaylistId === playlist.spotifyPlaylistId && 
                        dbPlaylist.userId === playlist.userId && (dbPlaylist.name !== playlist.name || dbPlaylist.description !== playlist.description)) {
                    }
            }
            if(newPlaylist) {
                newPlaylists.push(playlist);
            }
        }

        for(let existing of playlistsExisting) {
            if(!playlists.find(el => existing.spotifyPlaylistId === el.spotifyPlaylistId)) {
                toDeletePlaylists.push(existing);
            }
        }
        if(newPlaylists.length > 0) {
            await userPlaylistRepository.save(newPlaylists);
            console.info(`[${new Date().toISOString()}] ${user.email} saved new playlists to database!`)
        }
        if(toDeletePlaylists.length) {
            let playlists = toDeletePlaylists.map(el => el.spotifyPlaylistId);
            await userPlaylistRepository.delete(playlists);
            console.info(`[${new Date().toISOString()}] ${user.email} deleted playlists: ${playlists} from database!`)
        }
        return(new ApiResponse(new ApiSuccess(playlists)))
    }

}