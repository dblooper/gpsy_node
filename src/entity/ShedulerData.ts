import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity()
export default class UserShedulerData {

    @PrimaryGeneratedColumn()
    entryId: number;

    @OneToOne(() => User)
    @JoinColumn()
    userLogin: User;

    @Column()
    lastDateRefreshToken: Date;

    @Column()
    lastDateReceivedPlaylists: Date;

    @Column()
    lastDateReceivedRecentTracks: Date;

};
