import { pino } from 'pino';
import pinoPretty from 'pino-pretty';
import { config } from '@/config';

const pretty = config.log.format == 'pretty'
	? pinoPretty()
	: undefined;

export const logger = pino({
	level: config.log.level
}, pretty);
