/*
-- Table: custom_translations
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class CustomTranslations {

    @PrimaryGeneratedColumn()
    id!: number;

    @PrimaryGeneratedColumn()
    cartodb_id!: number;
    
    @Column({ type: 'varchar', length: 10, nullable: false })
    @PrimaryGeneratedColumn()
    lang!: string;

    @Column({ type: 'text', nullable: false })
    translation!: string;
}

