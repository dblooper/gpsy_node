
import {Entity, Column, PrimaryColumn, CreateDateColumn} from 'typeorm'

@Entity()
export class TrackGeneres {

    @PrimaryColumn()
    trackId: string;

    @Column()
    genre1: string;

    @Column()
    genre2: string;

    @Column()
    genre3: string;

    @Column()
    genre4: string;

    @Column()
    genre5: string;

    @Column()
    genre6: string;

    @Column()
    genre7: string;

    @Column()
    genre8: string;

    @Column()
    genre9: string;

    @Column()
    genre10: string;

    @CreateDateColumn()
    insertDate: Date;
}