import { ApiError } from "../apiResponse/ApiError";
import { ApiResponse } from "../apiResponse/ApiResponse";
import { ApiSuccess } from "../apiResponse/ApiSuccess";
import { User } from "../entity/User";
import { UserPlaylist } from "../entity/UserPlaylist";
import SpotifyTracksRequestsService from "./SpotifyTracksRequestsService";
import {factory} from '../config/LoggerConfig'

export class SpotifyPlaylistRequestService {
    
    static LOG = factory.getLogger('SpotifyPlaylistRequestService');

    static retrieveUserPlaylistsSheduler = async (user, spotifyApi, userPlaylistRepository, spotifyTracksRepository) => {
        try {
            await SpotifyPlaylistRequestService.retrieveUserPlaylists(user, spotifyApi, userPlaylistRepository);
        } catch(err) {
            SpotifyPlaylistRequestService.LOG.error(`Something went wrong when retrieving playlists`, err);
            return new Date();
        }
        
        try {
            let playlists: UserPlaylist[] = await userPlaylistRepository.find({userId: user.id});
            for(let playlist of playlists) {
                await SpotifyTracksRequestsService.retrieveUserPlaylistTracks(playlist.spotifyPlaylistId
                    ,user
                    ,spotifyApi
                    ,userPlaylistRepository
                    ,spotifyTracksRepository
                    )
            }
            SpotifyPlaylistRequestService.LOG.info(`${user.email} Playlists refreshed successfully`)
            return new Date();
        } catch(err) {
            SpotifyPlaylistRequestService.LOG.error(`Something went wrong when retrieving playlists`, err);
            return new Date();
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
            SpotifyPlaylistRequestService.LOG.info(`${user.email} saved new playlists to database!`)
        }
        if(toDeletePlaylists.length) {
            let playlists = toDeletePlaylists.map(el => el.spotifyPlaylistId);
            await userPlaylistRepository.delete(playlists);
            SpotifyPlaylistRequestService.LOG.info(`${user.email} deleted playlists: ${playlists} from database!`)
        }
        return(new ApiResponse(new ApiSuccess(playlists)))
    }

    public static addSpotifyPlaylist = async(providedName: String, providedPublic, providedDesc, spotifyApi: any, user: User, userPlaylistRepository) => {

        let playlist: UserPlaylist = await userPlaylistRepository.findOne({userId: user.id, name: providedName})
                if(!playlist && providedName) { 
                    try {
                        let createdPlaylist = await spotifyApi
                                                        .createPlaylist(providedName, 
                                                                        {'description': providedDesc ? providedDesc : '',
                                                                        'public': providedPublic === 'true' ? true : false 
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
                            SpotifyPlaylistRequestService.LOG.info(`[${new Date().toUTCString()}] New playlist ${newPlaylist.spotifyPlaylistId} created by ${user.email}`)
                            return (new ApiResponse(new ApiSuccess(newPlaylist)));
                      } else {
                        SpotifyPlaylistRequestService.LOG.error(`${user.id} Playlist ${providedName} not created`);
                        return (new ApiResponse(new ApiError(455, `Playlist not created! Spotify service error`)));  
                      }
                    } catch(err) {
                        SpotifyPlaylistRequestService.LOG.error(`Playlist ${providedName} not created`, err)
                        return (new ApiResponse(new ApiError(455, `Playlist not created! Internal Error`)));
                    }   
                } else {
                    SpotifyPlaylistRequestService.LOG.error(`Playlist ${providedName} found in database`);
                    return (new ApiResponse(new ApiError(455, `Playlist found. Change playlist name and try again!`)));
                }
    }
};
