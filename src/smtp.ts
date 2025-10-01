import { SMTPServer } from 'smtp-server';
import { logger } from './logger';
import { extractPidFromEmail, getAccountInfoFromPid } from './utils';
import { getTransporter } from './smtp-connection';
import { config } from './config';
import { relayedMessagesTotal } from './metrics';
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

	const rawMessageWithCorrectToHeader = msg.rawMessage.replace(
		/^To:.*$/m,
		`To: ${user.emailAddress}`
	);

	await getTransporter().sendMail({
		envelope: {
			from: msg.session.envelope.mailFrom.address,
			to: [user.emailAddress]
		},
		raw: rawMessageWithCorrectToHeader
	});
	logger.info(`Relayed email to ${email}`);
	relayedMessagesTotal.inc();
}

export function makeSmtpServer() {
	return new SMTPServer({
		hideSTARTTLS: true,
		onAuth(auth, _session, cb) {
			if (auth.username !== config.server.username || auth.password !== config.server.password) {
				return cb(new Error('Invalid username or password'));
			}
			cb(null, { user: auth.username });
		},
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
