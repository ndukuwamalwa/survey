import { Args, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { ConstituencyEntity, RawDataDetailEntity, RawDataEntity, SurveyDetailEntity, SurveyEntity } from "src/entities/survey.entity";
import { SmsService } from "src/services/sms.service";
import { UserService } from "src/services/user.service";
import {
    Constituency,
    MutationResponse,
    RawData,
    SampleInput,
    Survey, SurveyResponseChartData, SurveyResponseSummary, SurveyResponseSummaryDtl,
    SurveySampleInput,
    SurveySummary
} from "src/types/survey.types";
import { getManager, Repository } from "typeorm";

@Resolver(() => Survey)
export class SurveyResolver {
    constructor(
        @InjectRepository(SurveyEntity) private surveyRepo: Repository<SurveyEntity>,
        @InjectRepository(SurveyDetailEntity) private surveyDetailsRepo: Repository<SurveyDetailEntity>,
        @InjectRepository(RawDataEntity) private rawRepo: Repository<RawDataEntity>,
        @InjectRepository(RawDataDetailEntity) private rawDtlRepo: Repository<RawDataDetailEntity>,
        private smsService: SmsService
    ) { }

    @Mutation(() => MutationResponse)
    async uploadData(
        @Args({ name: 'data', type: () => [SurveySampleInput] }) data: Array<SurveySampleInput>
    ): Promise<MutationResponse> {
        const label = 'TOTAL INSERT TIME';
        console.time(label);
        if (data.length === 0) {
            return {
                success: false,
                message: `No data provided`
            };
        }
        let counter = 0;
        const details: Array<RawDataDetailEntity> = data.map(v => {
            const valid = SurveyResolver.isKePhoneNo(v.phone);
            const phone = valid ? SurveyResolver.formatKePhone(v.phone) : v.phone;
            if (valid) {
                counter += 1;
            }
            return {
                code: null,
                phone,
                raw: null,
                county: v.county,
                constituency: (v.constituency || '').toUpperCase(),
                ward: (v.area || '').toUpperCase(),
                pollingStation: v.pollingStation,
                dob: v.dob,
                firstname: v.firstname,
                surname: v.surname,
                middlename: v.middlename,
                gender: v.gender,
                idPassport: v.idPassport,
                phoneValid: valid
            }
        });
        const raw: RawDataEntity = {
            code: null,
            uploadDate: UserService.currentTimestamp(),
            records: details.length,
            validPhones: counter,
            constituencyCount: 0,
            wardCount: 0
        };
        try {
            const insert = await this.rawRepo.save(raw);
            const mps: Array<{ [name: string]: Array<string> }> = [];
            details.forEach(v => {
                if (mps[v.constituency]) {
                    mps[v.constituency].push(v.ward);
                } else {
                    mps[v.constituency] = [v.ward];
                }
            });
            const constituencies: Array<ConstituencyEntity> = [];
            let constituencyCount = 0;
            let wardCount = 0;
            for (let key of Object.keys(mps)) {
                const wards: Array<string> = Array.from(new Set(mps[key]));
                constituencies.push({
                    code: null,
                    raw: insert.code,
                    name: key,
                    wards
                });
                constituencyCount += 1;
                wardCount += wards.length
            }
            await getManager().getRepository(ConstituencyEntity).insert(constituencies);
            const newDetails = details.map(v => ({ ...v, raw: insert.code }));
            const batches: Array<Array<RawDataDetailEntity>> = [];
            const batchSize = 20_000;
            let remaining = newDetails.length;
            let start = 0;
            while (remaining > 0) {
                batches.push(newDetails.slice(start, start + batchSize));
                remaining -= batchSize;
                start += batchSize;
            }
            for (let batch of batches) {
                await this.rawDtlRepo.insert(batch);
            }
            await this.rawRepo.update({ code: insert.code }, { constituencyCount, wardCount });
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

    @Mutation(() => MutationResponse)
    async sampleData(
        @Args({ name: 'data', type: () => SampleInput }) data: SampleInput
    ): Promise<MutationResponse> {
        const sampleTime = 'SAMPLING TIME';
        const raw = await this.rawRepo.findOne({ code: data.raw });
        if (!raw) {
            return {
                success: false,
                message: `No Raw Data Found`
            };
        }
        console.time(sampleTime);
        let query: string;
        const params = [];
        let isPerConstituency = data.constituency.toUpperCase() !== 'ALL';
        let isPerWard = isPerConstituency && data.ward.toUpperCase() !== 'ALL';
        if (isPerConstituency) {
            if (isPerWard) {
                // Sampling per C.A.W
                query = `SELECT pollingStation, COUNT(*) count FROM raw_data_dtls WHERE raw=? AND constituency=? AND ward=? GROUP BY pollingStation`;
                params.push(data.raw, data.constituency, data.ward);
            } else {
                // Sampling per Constituency
                query = `SELECT ward, COUNT(*) count FROM raw_data_dtls WHERE raw=? AND constituency=? GROUP BY ward`;
                params.push(data.raw, data.constituency);
            }
        } else {
            // Sampling per County
            query = `SELECT ward, COUNT(*) count FROM raw_data_dtls WHERE raw=? GROUP BY ward`;
            params.push(data.raw);
        }
        const dataToSample: Array<{ ward: string, pollingStation: string, count: number }> = await getManager().query(query, params);
        const sampleSize = this.getSampleSize(dataToSample.length);
        const selectedIndices = this.getRandomIndices(sampleSize);
        const selectedData = dataToSample.filter((v, i) => selectedIndices.includes(i));

        let survey: SurveyEntity = {
            code: null,
            records: 0,
            samples: 0,
            question: data.question,
            smsSent: false,
            constituency: data.constituency,
            ward: data.ward,
            area: isPerWard ? 'Polling Station' : isPerConstituency ? 'C.A.W' : 'Constituency',
            raw: data.raw,
            choices: data.choices
        };
        survey = await this.surveyRepo.save(survey);
        let records = 0, samples = 0;
        for (let item of selectedData) {
            let items: Array<RawDataDetailEntity>;
            if (isPerWard) {
                items = await this.rawDtlRepo.find({
                    where: {
                        raw: data.raw, constituency: data.constituency, pollingStation: item.pollingStation
                    },
                    select: ['code', 'phone', 'pollingStation', 'ward']
                });
            } else if (!isPerWard && isPerConstituency) {
                items = await this.rawDtlRepo.find({
                    where: {
                        raw: data.raw, constituency: data.constituency, ward: item.ward
                    },
                    select: ['code', 'phone', 'pollingStation', 'ward', 'constituency']
                });
            } else {
                items = await this.rawDtlRepo.find({
                    where: {
                        raw: data.raw, ward: item.ward
                    },
                    select: ['code', 'phone', 'pollingStation', 'ward']
                });
            }
            const sSize = this.getSampleSize(items.length);
            const selectedIndices = this.getRandomIndices(sSize);
            const sampled = items.filter((v, i) => selectedIndices.includes(i));
            const sampledCodes = sampled.map(i => i.code);
            const dtls: Array<SurveyDetailEntity> = items.map(v => ({
                code: null,
                survey: survey.code,
                phone: v.phone,
                responded: false,
                response: null,
                dateResponded: null,
                pollingStation: v.pollingStation,
                ward: v.ward,
                selected: sampledCodes.includes(v.code),
                choice: null,
                constituency: v.constituency
            }));
            records += dtls.length;
            samples += sSize;
            await this.surveyDetailsRepo.insert(dtls);
        }
        await this.surveyRepo.update({ code: survey.code }, { records, samples });
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

        return Math.ceil(numerator / denominator);
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

    static isKePhoneNo(value: string): boolean {
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

    static formatKePhone(value: string): string {
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
        if (value.length === 9) {
            return `+254${value}`;
        }
    }

    @Mutation(() => MutationResponse)
    async sendSMS(
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<MutationResponse> {
        let survey = await this.surveyRepo.findOne({ code });
        if (!survey) {
            return {
                success: false,
                message: `Invalid Survey ID`
            };
        }
        if (!survey.question || survey.question.trim().length === 0) {
            return {
                success: false,
                message: `No question set.`
            };
        }
        const data = await this.surveyDetailsRepo.find({ survey: survey.code });
        const phones: Array<string> = data.map(v => v.phone);
        const res = await this.smsService.send(['+254725781197'], survey.question);
        await this.surveyRepo.update({ code }, { smsSent: true });
        return {
            success: true,
            message: `Question sending to respondents is in progress`
        };
    }

    @Query(() => [RawData])
    async rawData(): Promise<Array<RawData>> {
        return await this.rawRepo.find({
            order: {
                uploadDate: 'DESC'
            }
        });
    }

    @Query(() => [Constituency])
    async rawConstituencies(
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<Array<Constituency>> {
        return await getManager().getRepository(ConstituencyEntity).find({
            where: {
                raw: code
            },
            select: ['name', 'wards']
        });
    }

    @Query(() => Survey)
    async survey(
        @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<Survey> {
        return await this.surveyRepo.findOne({ code });
    }

    @Query(() => [Survey])
    async surveys(
        @Args({ name: 'raw', type: () => Number }) raw: number
    ): Promise<Array<Survey>> {
        return await this.surveyRepo.find({
            order: {
                code: 'DESC'
            },
            where: {
                raw
            }
        });
    }

    @ResolveField(() => [SurveySummary])
    async summary(@Parent() survey: Survey): Promise<Array<SurveySummary>> {
        const query = `
        SELECT ${survey.ward !== 'ALL' ? 'pollingStation' : 'ward'} area, COUNT(*) records, 
        (COUNT(IF(selected=1, 1, null))) samples
        FROM survey_dtls
        WHERE survey=${survey.code}
        GROUP BY survey_dtls.${survey.ward !== 'ALL' ? 'pollingStation' : 'ward'}
        `;
        return await getManager().query(query);
    }

    @Query(() => SurveyResponseChartData)
    async generalResponseOverview(
      @Args({ name: 'code', type: () => Number }) code: number
    ): Promise<SurveyResponseChartData> {
        const survey = await this.surveyRepo.findOne({ code });
        if (!survey) {
            return {
                summary: [],
                details: []
            };
        }
        const summary: Array<SurveyResponseSummaryDtl> = await getManager().query(`
            SELECT choice, COUNT(*) votes
            FROM survey_dtls 
            WHERE survey=? AND selected=1 AND responded=1
        `, [code]);
        console.table(summary);
        const details: Array<SurveyResponseSummary> = [];
        if (survey.area === 'Constituency') {
            if (survey.constituency === 'ALL') {
                const areas: Array<string> = (await getManager().query(`
                SELECT DISTINCT constituency
                FROM survey_dtls
                WHERE survey=?
                AND selected=1
                AND responded=1
            `, [code])).map(v => v.constituency);
                for (let area of areas) {
                    const responses: Array<SurveyResponseSummaryDtl> = await getManager().query(`
                    SELECT choice, SUM(*) votes
                    FROM survey_dtls
                    WHERE survey=?
                    AND selected=1
                    AND responded=1
                    AND constituency="${area}"
                `);
                    details.push({
                        area,
                        responses
                    });
                }
            } else {
                const areas: Array<string> = (await getManager().query(`
                SELECT DISTINCT ward
                FROM survey_dtls
                WHERE survey=?
                AND selected=1
                AND responded=1
                AND constituency="${survey.constituency}"
            `, [code])).map(v => v.ward);
                for (let area of areas) {
                    const responses: Array<SurveyResponseSummaryDtl> = await getManager().query(`
                    SELECT choice, SUM(*) votes
                    FROM survey_dtls
                    WHERE survey=?
                    AND selected=1
                    AND responded=1
                    AND ward="${area}"
                    AND constituency="${survey.constituency}"
                `);
                    details.push({
                        area,
                        responses
                    });
                }
            }
        } else if (survey.area === 'C.A.W') {
            if (survey.ward === 'ALL') {
                const areas: Array<string> = (await getManager().query(`
                SELECT DISTINCT pollingStation
                FROM survey_dtls
                WHERE survey=?
                AND selected=1
                AND responded=1
            `, [code])).map(v => v.pollingStation);
                for (let area of areas) {
                    const responses: Array<SurveyResponseSummaryDtl> = await getManager().query(`
                    SELECT choice, SUM(*) votes
                    FROM survey_dtls
                    WHERE survey=?
                    AND selected=1
                    AND responded=1
                `);
                    details.push({
                        area,
                        responses
                    });
                }
            } else {
                const areas: Array<string> = (await getManager().query(`
                SELECT DISTINCT pollingStation
                FROM survey_dtls
                WHERE survey=?
                AND selected=1
                AND responded=1
                AND ward="${survey.ward}"
            `, [code])).map(v => v.pollingStation);
                for (let area of areas) {
                    const responses: Array<SurveyResponseSummaryDtl> = await getManager().query(`
                    SELECT choice, SUM(*) votes
                    FROM survey_dtls
                    WHERE survey=?
                    AND selected=1
                    AND responded=1
                    AND ward="${area}"
                `);
                    details.push({
                        area,
                        responses
                    });
                }
            }
        }

        return {
            summary,
            details
        };
    }
}
