import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, Unique} from 'typeorm'

@Entity()
@Unique(['userId','spotifyTrackId'])
export class RecommendedTrack {
    
    @PrimaryGeneratedColumn()
    id: Number;

    @Column()
    userId: Number

    @Column()
    spotifyTrackId: String;
}
