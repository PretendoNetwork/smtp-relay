import { defineConfig } from 'tsup';

export default defineConfig(
	{
		entry: ['src/server.ts'],
		sourcemap: true,
		platform: 'node',
		clean: true,
		format: ['esm'],
		target: 'esnext'
	}
);
