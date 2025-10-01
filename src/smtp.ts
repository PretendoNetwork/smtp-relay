import { SMTPServer } from 'smtp-server';
import { logger } from './logger';
import { extractPidFromEmail, getAccountInfoFromPid } from './utils';
import { getTransporter } from './smtp-connection';
import type { SMTPServerSession } from 'smtp-server';

type SmtpMessage = {
	rawMessage: string;
	session: SMTPServerSession;
};

async function handleMessage(msg: SmtpMessage) {
	const email = msg.session.envelope.rcptTo[0].address;
	const pid = extractPidFromEmail(email);
	if (!pid) {
		throw new Error(`Could not extract PID from ${email}`);
	}

	const user = await getAccountInfoFromPid(pid);
	if (!user) {
		throw new Error(`Could not find account data for ${pid}`);
	}

	if (!msg.session.envelope.mailFrom) {
		throw new Error('No from header set');
	}

	await getTransporter().sendMail({
		from: msg.session.envelope.mailFrom.address,
		to: [user.emailAddress],
		raw: msg.rawMessage
	});
	logger.info(`Relayed email to ${email}`);
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
