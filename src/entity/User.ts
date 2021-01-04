import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, CreateDateColumn} from "typeorm";

@Entity()
export class User {

    @PrimaryColumn()
    id: String;

    @Column()
    email: string;

    @Column()
    name: string;

    @Column({default: 0})
    age: number;

    @Column()
    @CreateDateColumn()
    registerDate: Date;
}
