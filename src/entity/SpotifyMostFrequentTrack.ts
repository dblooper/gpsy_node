import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, Unique} from 'typeorm';

@Entity()
@Unique(['userId', 'spotifyTrackId'])
export class SpotifyMostFrequentTrack {

    @PrimaryGeneratedColumn()
    id: Number; 

    @Column()
    userId: Number;

    @Column()
    spotifyTrackId: String;

    @Column({default: 0})
    popularity: Number
}