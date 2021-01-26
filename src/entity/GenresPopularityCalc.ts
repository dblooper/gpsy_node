import { type } from 'os';
import {Column, CreateDateColumn, Entity, PrimaryColumn, Unique, UpdateDateColumn} from 'typeorm'

@Entity()
@Unique(['userId', 'genre'])
export class GenresPopularityCalc {

    @PrimaryColumn()
    userId: string;

    @PrimaryColumn()
    genre: string;

    @Column({type: 'decimal', precision: 20, scale: 3 })
    genrePopularity: number;

    @CreateDateColumn()
    insertDate: Date;

    @UpdateDateColumn()
    updateDate: Date;
}   