/* "lang":"nrm","langname":"Norman","autonym":"Nouormand",*/

/*
-- Table: languagues
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class Languages  {

    @Column({ type: 'varchar', length: 10, nullable: false })
    @PrimaryGeneratedColumn()
    lang!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    langname!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    autonym!: string;

    @Column({ type: 'integer', nullable: true })
    active!: number;
}