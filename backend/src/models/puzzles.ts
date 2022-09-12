/*
-- Table: puzzles
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import ViewState from './viewState';

@Entity()
export default class Puzzles {
    @PrimaryGeneratedColumn('increment')
    id!: number
    
    @Column({ type: 'text', nullable: false })
    comment?: string

    @Column({ type: 'text', nullable: false })
    data!: string

    @Column({ type: 'text', nullable: false })
    icon!: string

    @Column({ type: 'text', nullable: false })
    name!: string

    @Column({ type: 'text', nullable: false })
    url!: string
    
    @Column({ type: 'text', nullable: false })
    wiki?: string

    view_state?: ViewState | null;
}




    