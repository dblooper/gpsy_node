import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, Unique, PrimaryColumn, UpdateDateColumn, CreateDateColumn} from 'typeorm';
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

    @Column({nullable: true})
    public: boolean;

    @UpdateDateColumn({nullable: true})
    lastUpdated: Date;

    @CreateDateColumn()
    insertDate: Date;

    @ManyToMany(() => SpotifyTrack, track => track.playlists, {eager: true, cascade: false})
    tracks: SpotifyTrack[];
}
