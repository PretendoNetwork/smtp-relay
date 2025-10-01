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

function extractPidFromInvalidEmail(email: string): number | null {
	const match = email.match(/^(\d+)@invalid\.com$/);
	if (!match) {
		return null;
	}

	return parseInt(match[1]);
}

export function extractPidFromEmail(email: string): number | null {
	const invalidEmailPid = extractPidFromInvalidEmail(email);
	if (invalidEmailPid) {
		return invalidEmailPid;
	}

	const match = email.match(/^(\d+)@pretendo\.network$/);
	if (!match) {
		return null;
	}

	return parseInt(match[1]);
}

export async function getAccountInfoFromPid(pid: number): Promise<GetUserDataResponse | null> {
	return gRPCAccountClient.getUserData({
		pid
	}).catch(() => null);
}
