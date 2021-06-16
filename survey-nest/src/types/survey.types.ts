import { InputType, ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class SurveySummary {
    @Field(typ => String)
    area: string;

    @Field(typ => Number)
    records: string;

    @Field(typ => Number)
    samples: string;
}

@ObjectType()
export class SurveyData {
    @Field(typ => Number)
    code: number;

    @Field(typ => String, { nullable: true })
    county: string;

    @Field(typ => String, { nullable: true })
    constituency: string;

    @Field(typ => String, { nullable: true })
    area: string;

    @Field(typ => String, { nullable: true })
    pollingStation: string;

    @Field(typ => String, { nullable: true })
    dob: string;

    @Field(typ => String, { nullable: true })
    firstname: string;

    @Field(typ => String, { nullable: true })
    middlename: string;

    @Field(typ => String, { nullable: true })
    surname: string;

    @Field(typ => String, { nullable: true })
    gender: string;

    @Field(typ => String, { nullable: true })
    phone: string;

    @Field(typ => String, { nullable: true })
    idPassport: string;
}

@ObjectType()
export class Survey {
    @Field(typ => Number)
    code: number;

    @Field(typ => Number)
    records: number;

    @Field(typ => Number)
    samples: number;

    @Field(typ => String)
    question: string;

    @Field(typ => Boolean)
    smsSent: boolean;

    @Field(typ => String)
    constituency: string;

    @Field(typ => String)
    ward: string;

    @Field(typ => String)
    area: 'Constituency' | 'C.A.W' | 'Polling Station';
}

@ObjectType()
export class MutationResponse {
    @Field(typ => Boolean)
    success: boolean;

    @Field(typ => String)
    message: string;
}

@InputType()
export class SurveySampleInput {
    @Field(typ => String, { nullable: true })
    county: string;

    @Field(typ => String, { nullable: true })
    constituency: string;

    @Field(typ => String, { nullable: true })
    area: string;

    @Field(typ => String, { nullable: true })
    pollingStation: string;

    @Field(typ => String, { nullable: true })
    dob: string;

    @Field(typ => String, { nullable: true })
    firstname: string;

    @Field(typ => String, { nullable: true })
    middlename: string;

    @Field(typ => String, { nullable: true })
    surname: string;

    @Field(typ => String, { nullable: true })
    gender: string;

    @Field(typ => String, { nullable: true })
    phone: string;

    @Field(typ => String, { nullable: true })
    idPassport: string;
}

@InputType()
export class SampleInput {
    @Field(typ => Number)
    raw: number;

    @Field(typ => String)
    constituency: string;

    @Field(typ => String)
    ward: string;

    @Field(typ => String)
    question: string;
}

@ObjectType()
export class Constituency {
    @Field(typ => String)
    name: string;

    @Field(typ => [String])
    wards?: Array<string>;
}

@ObjectType()
export class RawData {
    @Field(typ => Number)
    code: number;

    @Field(typ => String)
    uploadDate: string;

    @Field(typ => Number)
    records: number;

    @Field(typ => Number)
    validPhones: number;

    @Field(typ => [Constituency])
    constituencies?: Array<Constituency>;

    @Field(typ => Number)
    constituencyCount: number;

    @Field(typ => Number)
    wardCount: number;
}
