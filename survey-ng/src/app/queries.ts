import gql from "graphql-tag";

export const GET_QUESTIONS_QUERY = gql`{
    questions {
        code
        description
    }
}`

export const GET_SURVEYS = gql`{
    surveys {
        code
        uploadDate
        records
        samples
        question
        smsSent
        validPhones
    }
}`

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
