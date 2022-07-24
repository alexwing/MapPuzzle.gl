/*
-- Table: view_state
*/


import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import Puzzles from './puzzles';

@Entity()
export default class ViewState {

    @OneToOne(() => Puzzles, { nullable: false })
    @JoinColumn({ name: 'id' })
    puzzle!: Puzzles;

    @Column({ type: 'real', nullable: false })
    latitude!: number;

    @Column({ type: 'real', nullable: false })
    longitude!: number;

    @Column({ type: 'real', nullable: false })
    zoom!: number;
}
    
