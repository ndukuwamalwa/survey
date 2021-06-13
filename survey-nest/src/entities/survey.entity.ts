import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('question')
export class QuestionEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column({ unique: true })
    description: string;

    @OneToMany(typ => SurveyEntity, typ => typ.question)
    surveys: Promise<Array<SurveyEntity>>;
}

@Entity('survey')
export class SurveyEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column('timestamp')
    uploadDate: string;

    @Column()
    records: number;

    @Column()
    samples: number;

    @Column()
    smsSent: boolean;

    @Column()
    validPhones: number;

    @ManyToOne(typ => QuestionEntity, typ => typ.surveys)
    question: QuestionEntity;
}

@Entity('survey_dtls')
export class SurveyDetailEntity {
    @PrimaryGeneratedColumn()
    code: number;

    @Column()
    phone: string;

    @Column()
    survey: number;

    @Column()
    county: string;

    @Column()
    constituency: string;

    @Column()
    area: string;

    @Column()
    pollingStation: string;

    @Column()
    dob: string;

    @Column()
    firstname: string;

    @Column()
    middlename: string;

    @Column()
    surname: string;

    @Column()
    gender: string;

    @Column()
    idPassport: string;

    @Column({ nullable: true })
    response: string;

    @Column({ type: 'timestamp', nullable: true })
    dateResponded: string;

    @Column()
    responded: boolean;

    @Column()
    selected: boolean;
}
