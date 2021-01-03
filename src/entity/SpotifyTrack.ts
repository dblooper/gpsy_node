import {Entity, PrimaryGeneratedColumn,Column, ManyToMany, JoinTable, PrimaryColumn, CreateDateColumn, OneToMany} from 'typeorm'

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

    @Column()
    @CreateDateColumn()
    insertDate: Date;
}