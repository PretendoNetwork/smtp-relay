import { SMTPServer } from 'smtp-server';
import { logger } from './logger';
import type { SMTPServerSession } from 'smtp-server';

type SmtpMessage = {
	rawMessage: string;
	session: SMTPServerSession;
};

async function handleMessage(msg: SmtpMessage) {
	console.log(msg); // TODO implement relay
}

export function makeSmtpServer() {
	return new SMTPServer({
		authOptional: true, // no auth for incoming relay
		onData(stream, session, callback) {
			let rawMessage = '';

			stream.on('data', (chunk) => {
				rawMessage += chunk.toString();
			});

			stream.on('end', async () => {
				try {
					await handleMessage({
						rawMessage,
						session
					});
					callback();
					return;
				} catch (err: any) {
					logger.error(err);
					callback(err);
					return;
				}
			});
		}
	});
}
