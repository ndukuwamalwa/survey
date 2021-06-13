export interface SurveyData {
    code?: number;
    county: string;
    constituency: string;
    area: string;
    pollingStation: string;
    dob: string;
    firstname: string;
    middlename: string;
    surname: string;
    gender: string;
    phone: string;
    idPassport: string;
}

export interface Question {
    code: number;
    description: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
}

export interface Survey {
    code: number;
    uploadDate: string;
    records: number;
    sampes: number;
    question: string;
    smsSent: boolean;
    validPhones: number;
}

export interface SurveySummary {
    area: string;
    records: number;
    samples: number;
}
