/*
-- Table: view_state
*/


import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { ViewState as ViewStateRow } from '@mappuzzle/shared';

@Entity()
export default class ViewState implements ViewStateRow {

    @PrimaryColumn({ type: 'integer', nullable: false })
    id!: number;

    @Column({ type: 'real', nullable: false })
    latitude!: number;

    @Column({ type: 'real', nullable: false })
    longitude!: number;

    @Column({ type: 'real', nullable: false })
    zoom!: number;

    transitionDuration?: number;
    transitionInterpolator?: any;

    bearing?: number;
    pitch?: number;
}
    
