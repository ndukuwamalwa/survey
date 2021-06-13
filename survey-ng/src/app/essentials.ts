import { FetchResult } from '@apollo/client/core';
import { Message } from 'primeng/api';

interface MutationResponse {
    error: boolean;
    success: boolean;
    message: Message;
}

export class GraphQLEssentials {
    static handleMutationResponse(
        response: FetchResult<unknown, Record<string, any>>,
        mutationName: string
    ): MutationResponse {
        let returnVal: MutationResponse;
        if (response.errors) {
            returnVal = {
                error: true,
                success: false,
                message: {
                    severity: 'warn',
                    summary: 'Internal Server Error',
                    detail: 'Unable to complete request'
                }
            };
        } else {
            const rsp: { success: boolean, message: string, reset: boolean } = (response.data as any)[mutationName];
            returnVal = {
                error: false,
                success: rsp.success,
                message: {
                    severity: rsp.success ? 'success' : 'warn',
                    summary: rsp.success ? 'Successful' : 'Failed',
                    detail: rsp.message
                }
            };
        }

        return returnVal;
    }
}