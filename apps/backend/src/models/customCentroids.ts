/*
-- Table: custom_centroids
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { CustomCentroids as CustomCentroidsRow } from '@mappuzzle/shared';

@Entity()
export default class CustomCentroids implements CustomCentroidsRow {

    @PrimaryGeneratedColumn()
    id!: number;

    @PrimaryGeneratedColumn()
    cartodb_id!: number;

    @Column({ type: 'integer', nullable: false })
    left!: number;

    @Column({ type: 'integer', nullable: false })
    top!: number;
}
    