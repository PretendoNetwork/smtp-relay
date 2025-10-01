import express from 'express';
import { config } from './config';
import { logger } from './logger';
import { makeSmtpServer } from './smtp';

async function main(): Promise<void> {
	logger.info('Starting server');

	if (config.metrics.enabled) {
		const metrics = express();
		metrics.listen(config.metrics.port, '0.0.0.0', () => {
			logger.info(`Metrics server started on port ${config.metrics.port}`);
		});
	}

	const smtp = makeSmtpServer();
	smtp.listen(config.server.port, () => {
		logger.info(`SMTP server running on port ${config.server.port}`);
	});
}

main();
