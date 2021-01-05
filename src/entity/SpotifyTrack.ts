import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, PrimaryColumn, CreateDateColumn, OneToMany} from 'typeorm'
import { UserPlaylist } from './UserPlaylist';

@Entity()
export class SpotifyTrack {

    @PrimaryColumn()
    trackId: String;

    @Column()
    name: String;

    @Column()
    author: String;

    @Column()
    authorId: String;

    @Column()
    album: String;

    @Column()
    albumId: String;

    @Column({default: 0})
    durationMs: Number;

    @Column()
    @CreateDateColumn()
    insertDate: Date;

    @ManyToMany(() => UserPlaylist, playlist => playlist.tracks)
    @JoinTable()
    playlists: UserPlaylist[];
}