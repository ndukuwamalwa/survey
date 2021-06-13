import { Args, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { QuestionEntity, SurveyDetailEntity, SurveyEntity } from "src/entities/survey.entity";
import { SmsService } from "src/services/sms.service";
import { UserService } from "src/services/user.service";
import { MutationResponse, Question, Survey, SurveyData, SurveySampleInput, SurveySummary } from "src/types/survey.types";
import { getManager, In, Not, Repository } from "typeorm";

@Resolver(of => Survey)
export class SurveyResolver {
    constructor(
        @InjectRepository(SurveyEntity) private surveyRepo: Repository<SurveyEntity>,
        @InjectRepository(QuestionEntity) private questionRepo: Repository<QuestionEntity>,
        @InjectRepository(SurveyDetailEntity) private surveyDetailsRepo: Repository<SurveyDetailEntity>,
        private smsService: SmsService
    ) { }

    @Mutation(returns => MutationResponse)
    async uploadData(
        @Args({ name: 'data', type: () => [SurveySampleInput] }) data: Array<SurveySampleInput>,
        @Args({ name: 'question', type: () => Number }) questionCode: number
    ): Promise<MutationResponse> {
        const label = 'TOTAL INSERT TIME';
        console.time(label);
        if (data.length === 0) {
            return {
                success: false,
                message: `No sample provided`
            };
        }
        const question = await this.questionRepo.findOne({ code: questionCode });
        if (!question) {
            return {
                success: false,
                message: `Invalid Survey Question`
            };
        }
        const details: Array<SurveyDetailEntity> = data.map(v => ({
            ...v,
            code: null,
            question,
            phone: v.phone,
            survey: null,
            responded: false,
            dateResponded: null,
            response: null,
            selected: false
        }));
        const survey: SurveyEntity = {
            code: null,
            uploadDate: UserService.currentTimestamp(),
            smsSent: false,
            records: data.length,
            question,
            samples: 0,
            validPhones: 0
        };
        try {
            const insert = await this.surveyRepo.save(survey);
            const newDetails = details.map(v => ({ ...v, survey: insert.code }));
            const batches: Array<Array<SurveyDetailEntity>> = [];
            const batchSize = 20_000;
            let remaining = newDetails.length;
            let start = 0;
            while (remaining > 0) {
                batches.push(newDetails.slice(start, start + batchSize));
                remaining -= batchSize;
                start += batchSize;
            }
            for (let batch of batches) {
                await this.surveyDetailsRepo.insert(batch);
            }
            console.timeEnd(label);
            return {
                success: true,
                message: 'Saved Successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to Save Records`
            };
        }

    }

    @Mutation(returns => MutationResponse)
    async sampleData(
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<MutationResponse> {
        const sampleTime = 'SAMPLING TIME';
        const item = await this.surveyRepo.findOne({ code, samples: 0 });
        if (!item) {
            return {
                success: false,
                message: `No Data Found`
            };
        }
        console.time(sampleTime);
        const areaData: Array<{ code: number, area: string, count: number, sampleSize: number }> = await getManager()
            .query(`SELECT code, area, COUNT(*) count FROM survey_dtls WHERE survey=? GROUP BY area`, [code]);
        const sampleSize = this.getSampleSize(areaData.length);
        const selectedIndices = this.getRandomIndices(sampleSize);
        const selectedAreas = areaData.filter((v, i) => selectedIndices.includes(i));
        for (let area of selectedAreas) {
            const items = await this.surveyDetailsRepo.find({ area: area.area, survey: code });
            const sSize = this.getSampleSize(items.length);
            const selectedIndices = this.getRandomIndices(sSize);
            const sampled = items.filter((v, i) => selectedIndices.includes(i));
            area.sampleSize = sSize;
            const toSend: Array<number> = sampled.map(v => v.code);
            await this.surveyDetailsRepo.update({ code: In(toSend) }, { selected: true });
        }
        const final = selectedAreas.reduce((a, b) => {
            a.sampleSize += b.sampleSize;
            return a;
        });
        console.log(`Total Sample Size: ${final.sampleSize}`);
        await this.surveyRepo.update({ code }, { samples: final.sampleSize });
        console.timeEnd(sampleTime);
        return {
            success: true,
            message: `Sampling completed successfully.`
        };
    }

    getSampleSize(population: number): number {
        // The following are based on formula provided at to https://www.surveymonkey.com/mp/sample-size-calculator/
        const N = population;// Population Size
        const e2 = (5 / 100) ** 2; // Error Margin
        const zScore = 1.96; // Constant
        const p = 0.5; // Population Proportion
        const numerator1 = zScore ** 2 * p * (1 - p);
        const numerator = numerator1 / e2;
        const denominator = 1 + (numerator / N);
        const size = Math.ceil(numerator / denominator);

        return size;
    }

    getRandomIndices(size: number): Array<number> {
        const values: Array<number> = [];
        while (values.length < size) {
            const index = Math.floor(Math.random() * (size + 1));
            if (!values.includes(index)) {
                values.push(index);
            }
        }

        return values;
    }

    @Mutation(returns => MutationResponse)
    async addQuestion(
        @Args({ name: 'description', type: () => String }) description: string
    ): Promise<MutationResponse> {
        if (!description.endsWith('?')) {
            description = description + '?';
        }
        const question: QuestionEntity = {
            description,
            code: null,
            surveys: Promise.resolve([])
        };
        try {
            await this.questionRepo.insert(question);
            return {
                success: true,
                message: 'New question created successfully.'
            };
        } catch (error) {
            return {
                success: false,
                message: `Survey Question "${description}" Already Exists`
            };
        }
    }

    @Mutation(returns => MutationResponse)
    async updateQuestion(
        @Args({ name: 'description', type: () => String }) description: string,
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<MutationResponse> {
        let exist = await this.questionRepo.findOne({ code });
        if (!exist) {
            return { success: false, message: `Question Not Found` };
        }
        exist = await this.questionRepo.findOne({ description, code: Not(code) });
        if (exist) {
            return { success: false, message: `There exists another question with the same description` };
        }
        try {
            await this.questionRepo.update({ code }, { description });
            return { success: true, message: `Question Updated Successfully.` };
        } catch (error) {
            return { success: false, message: `Failed to update question` };
        }
    }

    private isKePhoneNo(value: string): boolean {
        if (!value || value.trim().length < 9) {
            return false;
        }
        value = value.trim().replace(' ', '');
        if (value.length === 9) {
            value = `+254${value}`;
        }
        if (value.length === 10) {
            value = `+254${value.substring(1)}`
        }
        if (value.length === 12) {
            value = `+${value}`;
        }
        if (!value.startsWith('+254')) {
            return false;
        }
        if (value.length !== 13) {
            return false;
        }
        value = value.substring(4);
        if (!value.startsWith('7') && !value.startsWith('1')) {
            return false;
        }
        const lastNine = /^[0-9]{9}$/;

        return lastNine.test(value);
    }

    private formatKePhone(value: string): string {
        // This functions assumes the phone number has already been validated
        value = value.trim().replace(' ', '');
        if (value.length === 13) {
            return value;
        }
        if (value.length === 12) {
            return `+${value}`;
        }
        if (value.length === 10) {
            return `+254${value.substring(1)}`;
        }
        if (value.length === 7) {
            return `+254${value}`;
        }
    }

    @Mutation(returns => MutationResponse)
    async deleteQuestion(
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<MutationResponse> {
        const question = await this.questionRepo.findOne({ code });
        if (!question) {
            return { success: false, message: `Question Not Found` };
        }
        const surveys = await this.surveyRepo.count({ question });
        if (surveys > 0) {
            return { success: false, message: `Cannot delete a question that has surveys` };
        }
        try {
            await this.questionRepo.delete({ code });
            return { success: true, message: `Question Deleted Successfully.` };
        } catch (error) {
            return { success: false, message: `Failed to delete question` };
        }
    }

    @Mutation(returns => MutationResponse)
    async sendSMS(
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<MutationResponse> {
        let survey = await this.questionRepo.query(`SELECT * FROM survey WHERE code=?`, [code]);
        if (survey.length === 0) {
            return {
                success: false,
                message: `Invalid Survey ID`
            };
        }
        survey = survey[0];
        const question = await this.questionRepo.findOne({ code: survey.questionCode });
        if (!question) {
            return {
                success: false,
                message: `Question Not Found`
            };
        }
        const data = await this.surveyDetailsRepo.find({
            where: {
                survey: survey.code,
                selected: true
            },
            select: ['phone']
        });
        const phones: Array<string> = data.filter(v => this.isKePhoneNo(v.phone)).map(v => this.formatKePhone(v.phone));
        const res = await this.smsService.send(['+254715040649'], question.description);
        await this.surveyRepo.update({ code }, { validPhones: phones.length, smsSent: true });
        return {
            success: true,
            message: `Question sending to respondents is in progress`
        };
    }

    @Query(returns => [Question])
    async questions(): Promise<Array<Question>> {
        const questions = await this.questionRepo.find();
        return questions;
    }

    @Query(returns => Survey)
    async survey(
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<Survey> {
        let surveys: Array<Survey> = await getManager().createQueryBuilder(SurveyEntity, 'survey')
            .select(`survey.code,uploadDate,records,validPhones,smsSent,question.description question,
            (SELECT COUNT(*) FROM survey_dtls WHERE survey=survey.code AND selected=1) samples`)
            .innerJoin(QuestionEntity, 'question', 'question.code=survey.questionCode')
            .where('survey.code=:code', { code })
            .orderBy('survey.code', 'DESC')
            .execute();

        return surveys[0];
    }

    @Query(returns => [Survey])
    async surveys(): Promise<Array<Survey>> {
        let surveys: Array<Survey> = await getManager().createQueryBuilder(SurveyEntity, 'survey')
            .select(`survey.code,uploadDate,records,validPhones,smsSent,question.description question,
            (SELECT COUNT(*) FROM survey_dtls WHERE survey=survey.code AND selected=1) samples`)
            .innerJoin(QuestionEntity, 'question', 'question.code=survey.questionCode')
            .orderBy('survey.code', 'DESC')
            .execute();

        return surveys;
    }

    @ResolveField(returns => [SurveySummary])
    async summary(@Parent() survey: Survey): Promise<Array<SurveySummary>> {
        const query = `
        SELECT area, COUNT(*) records, 
        (COUNT(IF(selected=1, 1, null))) samples
        FROM survey_dtls
        WHERE survey=${survey.code}
        GROUP BY survey_dtls.area
        HAVING (COUNT(IF(selected=1, 1, null))) > 0`;
        const data = await getManager().query(query);

        return data;
    }

    @ResolveField(returns => [SurveyData])
    async raw(
        @Parent() survey: Survey,
        @Args({ name: 'page', type: () => Number, nullable: true }) page: number
    ): Promise<Array<SurveyData>> {
        if (!page) {
            page = 1;
        }
        const PAGE_SIZE = 40;
        const data = await this.surveyDetailsRepo.find({
            where: {
                survey: survey.code
            },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE
        });

        return data;
    }
}
