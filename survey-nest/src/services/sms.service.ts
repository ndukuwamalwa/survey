import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Africastalking  from 'africastalking';
import { MutationResponse } from "src/types/survey.types";

@Injectable()
export class SmsService {
    constructor(
        private configService: ConfigService
    ) {}

    private smsInstance(): any {
        const credentials = {
            apiKey: this.configService.get('AT_API_KEY'),
            username: this.configService.get('AT_USERNAME')
        };
        const at = Africastalking(credentials);
        return at.SMS;
    }

    async send(phone: Array<string>, message): Promise<MutationResponse> {
        const options = {
            to: phone,
            message,
            enqueue: true // Set to true if you would like to deliver as many messages to the API without waiting for an acknowledgement from telcos.
        };
        try {
            await this.smsInstance().send(options);
            return {
                success: true,
                message: `Messages Sent Successfully.`
            }
        } catch (error) {
            return {
                success: false,
                message: error
            }
        }
        
    }
}
