import {Entity, PrimaryGeneratedColumn, Column, Unique} from 'typeorm'

@Entity()
@Unique(['userId','spotifyTrackId'])
export class TrackPopularityCalc {

    @PrimaryGeneratedColumn()
    id: number; 

    @Column()
    userId: string;

    @Column()
    spotifyTrackId: string;

    @Column({type: 'datetime', nullable: true})
    recentlyPlayed: Date

    @Column({default: 0})
    popularity: number;
}