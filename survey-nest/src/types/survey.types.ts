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

    @Field(typ => String)
    uploadDate: string;

    @Field(typ => Number)
    records: number;

    @Field(typ => Number)
    samples: number;

    @Field(typ => String)
    question: string;

    @Field(typ => Number)
    smsSent: boolean;

    @Field(typ => Number)
    validPhones: number;

    @Field(typ => [SurveySummary], { nullable: true })
    summary: Array<SurveySummary>;

    @Field(typ => [SurveyData], { nullable: true })
    raw: Array<SurveyData>
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

@ObjectType()
export class Question {
    @Field(typ => Number)
    code: number;

    @Field(typ => String)
    description: string;
}
