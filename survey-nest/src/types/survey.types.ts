import { InputType, ObjectType, Field, Int } from "@nestjs/graphql";

@ObjectType()
export class SurveySummary {
    @Field(() => String)
    area: string;

    @Field(() => Number)
    records: string;

    @Field(() => Number)
    samples: string;
}

@ObjectType()
export class SurveyData {
    @Field(() => Number)
    code: number;

    @Field(() => String, { nullable: true })
    county: string;

    @Field(() => String, { nullable: true })
    constituency: string;

    @Field(() => String, { nullable: true })
    area: string;

    @Field(() => String, { nullable: true })
    pollingStation: string;

    @Field(() => String, { nullable: true })
    dob: string;

    @Field(() => String, { nullable: true })
    firstname: string;

    @Field(() => String, { nullable: true })
    middlename: string;

    @Field(() => String, { nullable: true })
    surname: string;

    @Field(() => String, { nullable: true })
    gender: string;

    @Field(() => String, { nullable: true })
    phone: string;

    @Field(() => String, { nullable: true })
    idPassport: string;
}

@ObjectType()
export class Survey {
    @Field(() => Number)
    code: number;

    @Field(() => Number)
    records: number;

    @Field(() => Number)
    samples: number;

    @Field(() => String)
    question: string;

    @Field(() => Boolean)
    smsSent: boolean;

    @Field(() => String)
    constituency: string;

    @Field(() => String)
    ward: string;

    @Field(() => String)
    area: 'Constituency' | 'C.A.W' | 'Polling Station';
}

@ObjectType()
export class MutationResponse {
    @Field(() => Boolean)
    success: boolean;

    @Field(() => String)
    message: string;
}

@InputType()
export class SurveySampleInput {
    @Field(() => String, { nullable: true })
    county: string;

    @Field(() => String, { nullable: true })
    constituency: string;

    @Field(() => String, { nullable: true })
    area: string;

    @Field(() => String, { nullable: true })
    pollingStation: string;

    @Field(() => String, { nullable: true })
    dob: string;

    @Field(() => String, { nullable: true })
    firstname: string;

    @Field(() => String, { nullable: true })
    middlename: string;

    @Field(() => String, { nullable: true })
    surname: string;

    @Field(() => String, { nullable: true })
    gender: string;

    @Field(() => String, { nullable: true })
    phone: string;

    @Field(() => String, { nullable: true })
    idPassport: string;
}

@InputType()
export class SampleInput {
    @Field(() => Number)
    raw: number;

    @Field(() => String)
    constituency: string;

    @Field(() => String)
    ward: string;

    @Field(() => String)
    question: string;

    @Field(() => [String])
    choices: Array<string>;
}

@ObjectType()
export class Constituency {
    @Field(() => String)
    name: string;

    @Field(() => [String])
    wards?: Array<string>;
}

@ObjectType()
export class RawData {
    @Field(() => Number)
    code: number;

    @Field(() => String)
    uploadDate: string;

    @Field(() => Number)
    records: number;

    @Field(() => Number)
    validPhones: number;

    @Field(() => [Constituency])
    constituencies?: Array<Constituency>;

    @Field(() => Number)
    constituencyCount: number;

    @Field(() => Number)
    wardCount: number;
}

@ObjectType()
export class SurveyResponseSummaryDtl {
    @Field(() => String, { nullable: true })
    choice: string;

    @Field(() => Int)
    votes: number;
}

@ObjectType()
export class SurveyResponseSummary {
    @Field(() => String)
    area: string;

    @Field(() => [SurveyResponseSummaryDtl])
    responses: Array<SurveyResponseSummaryDtl>;
}

@ObjectType()
export class SurveyResponseChartData {
    @Field(() => [SurveyResponseSummaryDtl])
    summary: Array<SurveyResponseSummaryDtl>;

    @Field(() => [SurveyResponseSummary])
    details: Array<SurveyResponseSummary>;
}
