import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, Unique} from 'typeorm';
import { PlaylistTrack } from './PlaylistTrack';

@Entity()
@Unique(['userId', 'spotifyPlaylistId'])
export class UserPlaylist {

    @PrimaryGeneratedColumn()
    internalPlaylistId: Number;

    @Column()
    userId: Number;

    @Column()
    spotifyPlaylistId: String;

    @Column()
    name: String;

    @Column({nullable: true})
    description: String;

    @ManyToMany(() => PlaylistTrack, track => track.playlists)
    tracks: PlaylistTrack[];
}
