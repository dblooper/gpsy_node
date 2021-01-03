import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, CreateDateColumn} from "typeorm";

@Entity()
export class User {

    @PrimaryColumn()
    id: String;

    @Column()
    email: string;

    @Column()
    name: string;

    @Column()
    age: number;

    @Column()
    @CreateDateColumn()
    registerDate: Date;
}
