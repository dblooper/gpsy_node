import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, CreateDateColumn, Unique} from "typeorm";
import jwt from 'jsonwebtoken'

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

    generateJWT = () => {
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setDate(now.getDate() + 60);

        return jwt.sign({
            login: this.login,
            id: this.id,
            exp: expirationDate.getTime()/1000
        }, 'secret', { algorithm: 'HS256'})
    }
}
