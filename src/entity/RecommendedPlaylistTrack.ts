import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable} from 'typeorm'
import { RecommendedPlaylist } from './RecommendedPlaylist';

@Entity()
export class RecommendedPlaylistTrack {
    
    @PrimaryGeneratedColumn()
    playlistTrackId: Number;

    @Column()
    spotifyTrackId: String;

    @Column()
    title: String;

    @Column()
    artists: String;

    @Column()
    sample: String;

    @ManyToMany(() => RecommendedPlaylist, playlist => playlist.tracks)
    @JoinTable()
    recommendedPlaylists: RecommendedPlaylist[];
}