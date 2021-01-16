import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, PrimaryColumn, CreateDateColumn, OneToMany} from 'typeorm'
import { RecommendedPlaylist } from './RecommendedPlaylist';
import { UserPlaylist } from './UserPlaylist';

@Entity()
export class SpotifyTrack {

    @PrimaryColumn()
    trackId: string;

    @Column()
    name: string;

    @Column()
    author: string;

    @Column()
    authorId: string;

    @Column()
    album: string;

    @Column()
    albumId: string;

    @Column({default: 0})
    durationMs: Number;

    @Column({default: ''})
    genres: string;

    @Column()
    @CreateDateColumn()
    insertDate: Date;

    @ManyToMany(() => UserPlaylist, playlist => playlist.tracks, {cascade: false})
    @JoinTable()
    playlists: UserPlaylist[];

    @ManyToMany(() => RecommendedPlaylist, playlist => playlist.tracks, {cascade: false})
    @JoinTable()
    recommendedPlaylists: RecommendedPlaylist[];
}