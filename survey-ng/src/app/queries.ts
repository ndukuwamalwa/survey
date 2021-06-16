import gql from "graphql-tag";

export const GET_QUESTIONS_QUERY = gql`{
    questions {
        code
        description
    }
}`

export const GET_RAW_DATA = gql`{
    rawData {
        code
        uploadDate
        records
        validPhones
        constituencyCount
        wardCount
    }
}`;

export const GET_CONSTITUENCIES = (code: number)=> gql`{
    rawConstituencies(code: ${code}) {
        name
        wards
    }
}`;

export const GET_SURVEYS = (raw: number) => gql`{
    surveys(raw: ${raw}) {
        code
        records
        samples
        question
        smsSent
        constituency
        ward,
        area
    }
}`;

export const GET_SURVEY_RAW = (survey: number, page: number) => gql`
{
    survey(code: ${survey}) {
        raw(page: ${page}) {
            code
            county
            constituency
            area
            pollingStation
            dob
            firstname
            middlename
            surname
            gender
            phone
            idPassport
        }
    }
}
`;

export const GET_SURVEY_SUMMARY = (survey: number) => gql`
{
    survey(code: ${survey}) {
        summary {
            area
            records
            samples
        }
    }
}
`;
