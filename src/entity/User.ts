import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, CreateDateColumn, Unique} from "typeorm";
import jwt from 'jsonwebtoken'
import * as bcrypt from 'bcrypt';

@Entity()
@Unique(['email'])
export class User {

    @PrimaryColumn()
    login: string;

    @Column()
    private password:string

    @Column({default: null})
    id: string;

    @Column({default: null})
    email: string;

    @Column({default: null})
    registrationEmail: string;

    @Column({default: null})
    name: string;

    @Column({default: 0})
    age: number;

    @Column()
    @CreateDateColumn()
    registerDate: Date;

    @Column({default: null})
    spotifyLink: string

    @Column({default: null})
    spotifyRefreshToken: string

    @Column({nullable: true}) 
    spotifyImageUrl: string

    @Column({nullable: true})
    userImage: string

    @Column("blob",{ 
        nullable:true,
        name:"imageBlob"
    })
    imageBlob: Buffer;

    generateJWT = () => {
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setTime(now.getTime() + 3600*1000);
        return jwt.sign({
            login: this.login,
            id: this.id,
            exp: expirationDate.getTime()/1000
        }, 'secret-gpsy-app', { algorithm: 'HS256'})
    }

    static decodeJWT(token) {
        return jwt.decode(token);
    }

    async setPassword(password) {
        this.password = await bcrypt.hash(password, 12);
    }

    getPassword() {
        return this.password;
    }
}
