/*
-- Table: custom_wiki
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { CustomWiki as CustomWikiRow } from '@mappuzzle/shared';

@Entity()
export default class CustomWiki implements CustomWikiRow {

    @PrimaryGeneratedColumn()
    id!: number;

    @PrimaryGeneratedColumn()
    cartodb_id!: number;
    
    @Column({ type: 'text', nullable: false })
    wiki!: string;
}
