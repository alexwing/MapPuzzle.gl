/*
-- Table: custom_wiki
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class CustomWiki {

    @PrimaryGeneratedColumn()
    id!: number;

    @PrimaryGeneratedColumn()
    cartodb_id!: number;
    
    @Column({ type: 'text', nullable: false })
    wiki!: string;
}
