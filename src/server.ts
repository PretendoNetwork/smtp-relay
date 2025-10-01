import express from 'express';
import { config } from './config';
import { logger } from './logger';
import { makeSmtpServer } from './smtp';
import { initSmtpConnection } from './smtp-connection';
import { register } from './metrics';

async function main(): Promise<void> {
	logger.info('Starting server');

	if (config.metrics.enabled) {
		const metrics = express();
		metrics.get('/metrics', async (req, res) => {
			try {
				res.set('Content-Type', register.contentType);
				res.end(await register.metrics());
			} catch (ex) {
				res.status(500).end(ex);
			}
		});
		metrics.listen(config.metrics.port, '0.0.0.0', () => {
			logger.info(`Metrics server started on port ${config.metrics.port}`);
		});
	}

	initSmtpConnection();
	logger.info('Connected to external SMTP server');

	logger.info('Starting SMTP server');
	const smtp = makeSmtpServer();
	smtp.listen(config.server.port, () => {
		logger.info(`SMTP server running on port ${config.server.port}`);
	});
}

main();
