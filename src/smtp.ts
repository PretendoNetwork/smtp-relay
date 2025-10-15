import { SMTPServer } from 'smtp-server';
import { logger } from './logger';
import { extractPidFromEmail, getAccountInfoFromPid, isExtractableEmail } from './utils';
import { getTransporter } from './smtp-connection';
import { config } from './config';
import { relayedMessagesTotal } from './metrics';
import type { SMTPServerSession } from 'smtp-server';

type SmtpMessage = {
	rawMessage: string;
	session: SMTPServerSession;
};

async function relayMessage(originalTo: string | null, from: string, to: string, raw: string): Promise<void> {
	const rawMessageWithCorrectToHeader = raw.replace(
		/^To:.*$/m,
		`To: ${to}`
	);

	await getTransporter().sendMail({
		envelope: {
			from,
			to: [to]
		},
		raw: rawMessageWithCorrectToHeader
	});
	if (originalTo) {
		logger.info(`Relayed email to ${originalTo}`);
	} else {
		logger.info(`Sent raw email to ${to}`);
	}
	relayedMessagesTotal.inc();
}

async function handleMessage(msg: SmtpMessage) {
	const [headers] = msg.rawMessage.split('\r\n\r\n', 1);
	logger.debug(`Handling message:\n${headers}`);

	const from = msg.session.envelope.mailFrom;
	const to = msg.session.envelope.rcptTo[0];

	if (msg.session.envelope.rcptTo.length > 1) {
		throw new Error('Cannot send message with multiple To addresses');
	}
	if (!to) {
		throw new Error('Message contains no To address');
	}
	if (!from) {
		throw new Error('Message contains no From address');
	}

	// Forward email without changes
	if (!isExtractableEmail(to.address)) {
		return await relayMessage(null, from.address, to.address, msg.rawMessage);
	}

	const pid = extractPidFromEmail(to.address);
	if (!pid) {
		throw new Error(`Could not extract PID from ${to.address}`);
	}

	const user = await getAccountInfoFromPid(pid);
	if (!user) {
		throw new Error(`Could not find account data for ${pid}`);
	}

	await relayMessage(to.address, from.address, user.emailAddress, msg.rawMessage);
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
					logger.error(err, 'Failed to relay message');
					callback(err);
					return;
				}
			});
		}
	});
}
