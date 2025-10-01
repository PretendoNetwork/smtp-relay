import { collectDefaultMetrics, Counter, Registry } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const relayedMessagesTotal = new Counter({
	name: 'smtp_relay_relayed_messages_total',
	help: 'Total number relayed messages',
	registers: [register]
});
