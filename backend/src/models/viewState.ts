/*
-- Table: view_state
*/


import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export default class ViewState {

    @PrimaryColumn({ type: 'integer', nullable: false })
    id!: number;

    @Column({ type: 'real', nullable: false })
    latitude!: number;

    @Column({ type: 'real', nullable: false })
    longitude!: number;

    @Column({ type: 'real', nullable: false })
    zoom!: number;
}
    
