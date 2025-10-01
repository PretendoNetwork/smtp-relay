import eslintConfig from '@pretendonetwork/eslint-config';

export default [
	...eslintConfig,
	{
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off'
		}
	}
];
