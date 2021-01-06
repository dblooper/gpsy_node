import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, Unique, CreateDateColumn, UpdateDateColumn} from 'typeorm'
import { SpotifyTrack } from './SpotifyTrack';

@Entity()
@Unique(['userId', 'name'])
export class RecommendedPlaylist {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: string;

    @Column()
    name: string

    @Column({nullable: true})
    description: string

    @Column({nullable: true})
    public: boolean

    @Column({nullable: true})
    spotifyPlaylistId: string;

    @Column({default: false})
    actual: boolean

    @Column({default: 20})
    trackQuantity: number

    @CreateDateColumn()
    insertDate: Date

    @UpdateDateColumn()
    updateDate: Date

    @Column({default: false})
    sentToSpotify: boolean

    @Column({default: null})
    sentToSpotifyDate: Date

    @ManyToMany(() => SpotifyTrack, track => track.recommendedPlaylists, {eager: true, cascade: false})
    tracks: SpotifyTrack[];
}