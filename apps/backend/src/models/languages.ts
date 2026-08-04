/* "lang":"nrm","langname":"Norman","autonym":"Nouormand",*/

/*
-- Table: languagues
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { Languages as LanguagesRow } from '@mappuzzle/shared';

@Entity()
export default class Languages implements LanguagesRow {

    @Column({ type: 'varchar', length: 10, nullable: false })
    @PrimaryGeneratedColumn()
    lang!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    langname!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    autonym!: string;

    @Column({ type: 'integer', nullable: true })
    active!: number;

    @Column({ type: 'integer', nullable: true })
    rtl!: number;

}