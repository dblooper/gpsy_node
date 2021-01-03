import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable} from 'typeorm'
import { RecommendedPlaylist } from './RecommendedPlaylist';
import { UserPlaylist } from './UserPlaylist';

@Entity()
export class PlaylistTrack {
    
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

    @ManyToMany(() => UserPlaylist, playlist => playlist.tracks)
    @JoinTable()
    playlists: UserPlaylist[];
}