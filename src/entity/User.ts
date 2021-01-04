import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, CreateDateColumn, Unique} from "typeorm";

@Entity()
@Unique(['email'])
export class User {

    @PrimaryColumn()
    login: string;

    @Column()
    password:string

    @Column({default: null})
    id: string;

    @Column({default: null})
    email: string;

    @Column({default: null})
    name: string;

    @Column({default: 0})
    age: number;

    @Column()
    @CreateDateColumn()
    registerDate: Date;

    @Column({default: null})
    spotifyRefreshToken: string
}
