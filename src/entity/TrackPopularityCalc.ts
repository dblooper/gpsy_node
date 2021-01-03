import {Entity, PrimaryGeneratedColumn, Column, Unique} from 'typeorm'

@Entity()
@Unique(['userId','spotifyTrackId'])
export class TrackPopularityCalc {

    @PrimaryGeneratedColumn()
    id: Number; 

    @Column()
    userId: Number;

    @Column()
    spotifyTrackId: String;

    @Column({type: 'datetime', nullable: true})
    recentPlayed: Date

    @Column({default: 0})
    popularity: Number;
}