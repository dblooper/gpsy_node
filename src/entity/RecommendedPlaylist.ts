import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, Unique} from 'typeorm'
import { RecommendedPlaylistTrack } from './RecommendedPlaylistTrack';

@Entity()
@Unique(['userId', 'spotifyPlaylistId'])
export class RecommendedPlaylist {

    @PrimaryGeneratedColumn()
    id: Number;

    @Column()
    userId: Number;

    @Column()
    spotifyPlaylistId: String;

    @ManyToMany(() => RecommendedPlaylistTrack, track => track.recommendedPlaylists)
    tracks: RecommendedPlaylistTrack[];
}