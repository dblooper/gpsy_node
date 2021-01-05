import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, Unique, PrimaryColumn} from 'typeorm';
import { SpotifyTrack } from './SpotifyTrack';

@Entity()
@Unique(['userId', 'spotifyPlaylistId'])
export class UserPlaylist {

    @PrimaryColumn()
    spotifyPlaylistId: string;

    @Column()
    userId: string;

    @Column()
    name: string;

    @Column({nullable: true})
    description: string;

    @ManyToMany(() => SpotifyTrack, track => track.playlists, {eager: true, cascade: false})
    tracks: SpotifyTrack[];
}
