/*
-- Table: custom_centroids
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class CustomCentroids {

    @PrimaryGeneratedColumn()
    id!: number;

    @PrimaryGeneratedColumn()
    cartodb_id!: number;

    @Column({ type: 'integer', nullable: false })
    left!: number;

    @Column({ type: 'integer', nullable: false })
    top!: number;
}
    