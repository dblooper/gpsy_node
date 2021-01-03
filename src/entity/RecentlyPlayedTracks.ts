import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, Unique, PrimaryColumn, CreateDateColumn} from 'typeorm'

@Entity()
@Unique(['userId', 'spotifyTrackId', 'playedAt'])
export class RecentlyPlayedTracks {
    
    @PrimaryGeneratedColumn()
    internalId: Number

    @Column({nullable: false})
    userId: String

    @Column({nullable: false})
    spotifyTrackId: String;

    @Column({nullable: false})
    playedAt: Date;

    @CreateDateColumn()
    insertDate: Date;

}