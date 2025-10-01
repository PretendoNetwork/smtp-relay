import { AccountDefinition } from '@pretendonetwork/grpc/account/account_service';
import { createChannel, createClient, Metadata } from 'nice-grpc';
import { config } from './config';
import type { GetUserDataResponse } from '@pretendonetwork/grpc/account/get_user_data_rpc';

const gRPCAccountChannel = createChannel(`${config.accountGrpc.host}:${config.accountGrpc.port}`);
const gRPCAccountClient = createClient(AccountDefinition, gRPCAccountChannel, {
	'*': {
		metadata: Metadata({
			'X-API-Key': config.accountGrpc.apiKey
		})
	}
});

export function extractPidFromEmail(_email: string): number {
	return 1234; // TODO implement
}

export async function getAccountInfoFromPid(pid: number): Promise<GetUserDataResponse> {
	return gRPCAccountClient.getUserData({
		pid
	});
}
