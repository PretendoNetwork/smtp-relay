import { createConfig, loaders, zodCoercedBoolean, zodSchemaToTransformer } from '@neato/config';
import { z } from 'zod';
import type { SchemaTransformer } from '@neato/config';
import type { AnyZodObject } from 'zod';

const schema = z.object({
	server: z.object({
		port: z.coerce.number().default(2525)
	}).default({}),
	smtp: z.object({
		host: z.string(),
		port: z.coerce.number(),
		secure: zodCoercedBoolean().default(false),
		username: z.string().optional(),
		password: z.string().optional()
	}),
	accountGrpc: z.object({
		host: z.string(),
		port: z.coerce.number(),
		apiKey: z.string()
	}),
	log: z.object({
		format: z.enum(['json', 'pretty']).default('pretty'),
		level: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info')
	}).default({}),
	metrics: z.object({
		enabled: zodCoercedBoolean().default(false),
		port: z.coerce.number().default(9090)
	}).default({})
});

export function schemaLoader<T extends AnyZodObject>(schema: T): SchemaTransformer<z.infer<T>> {
	const zodSchemaLoader = zodSchemaToTransformer<z.infer<T>>(schema);
	return {
		extract() {
			const keys = zodSchemaLoader.extract();
			return keys.map(v => ({
				normalizedKey: v.normalizedKey.replaceAll('__', '_'),
				outputKey: v.outputKey
			}));
		},
		validate(ctx) {
			return zodSchemaLoader.validate(ctx);
		}
	};
}

export const config = createConfig({
	envPrefix: 'PN_SMTP_RELAY_',
	loaders: [
		loaders.environment(),
		loaders.file('.env')
	],
	schema: schemaLoader(schema)
});
