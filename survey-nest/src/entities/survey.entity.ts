import { Column, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('raw_data')
export class RawDataEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column('timestamp')
    uploadDate: string;

    @Column()
    records: number;

    @Column()
    validPhones: number;

    @Column()
    constituencyCount: number;
    
    @Column()
    wardCount: number;
}

@Entity('raw_data_dtls')
export class RawDataDetailEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column()
    phone: string;

    @Column()
    raw: number;

    @Column()
    constituency: string;

    @Column()
    ward: string;

    @Column()
    pollingStation: string;

    @Column()
    dob: string;

    @Column()
    firstname: string;

    @Column({ nullable: true })
    middlename: string;

    @Column()
    surname: string;

    @Column()
    gender: string;

    @Column()
    idPassport: string;

    @Column()
    phoneValid: boolean;
}

@Entity('constituency')
@Index(['raw', 'name'], { unique: true })
export class ConstituencyEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column()
    raw: number;

    @Column()
    name: string;

    @Column('json')
    wards: Array<string>;
}

@Entity('survey')
export class SurveyEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column()
    records: number;

    @Column()
    samples: number;

    @Column()
    raw: number;

    @Column()
    question: string;

    @Column('json')
    choices: Array<string>;

    @Column()
    smsSent: boolean;

    @Column({ nullable: true })
    constituency: string;

    @Column({ nullable: true })
    ward: string;

    @Column({ nullable: true })
    area: 'Constituency' | 'C.A.W' | 'Polling Station';
}

@Entity('survey_dtls')
export class SurveyDetailEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column()
    survey: number;

    @Column()
    phone: string;

    @Column()
    constituency: string;

    @Column()
    ward: string;

    @Column()
    pollingStation: string;

    @Column()
    selected: boolean;

    @Column({ nullable: true })
    response: string;

    @Column({ nullable: true })
    choice: string;

    @Column({ type: 'timestamp', nullable: true })
    dateResponded: string;

    @Column()
    responded: boolean;
}
