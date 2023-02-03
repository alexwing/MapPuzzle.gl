/*
-- Table: countries
*/


import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class Countries {
    @PrimaryGeneratedColumn()
    countrycode!: number;

    @Column({ type: 'text', nullable: false })
    name!: string;

    @Column({ type: 'text', nullable: false })
    alpha2!: string;

    @Column({ type: 'text', nullable: false })
    alpha3!: string;

    @Column({ type: 'text', nullable: false })
    iso3166_2!: string;

    @Column({ type: 'text', nullable: false })
    region!: string;

    @Column({ type: 'text', nullable: false })
    subRegion!: string;

    @Column({ type: 'text', nullable: false })
    intermediateRegion!: string;

    @Column({ type: 'integer', nullable: false })
    regionCode!: number;

    @Column({ type: 'integer', nullable: false })
    subRegionCode!: number;

    @Column({ type: 'integer', nullable: false })
    intermediateRegionCode!: number;
}