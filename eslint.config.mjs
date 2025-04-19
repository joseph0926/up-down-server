// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: true },
    },
    plugins: {
      import: (await import('eslint-plugin-import')).default,
      'simple-import-sort': (await import('eslint-plugin-simple-import-sort')).default,
      'unused-imports': (await import('eslint-plugin-unused-imports')).default,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'warn',

      'max-len': 'off',
    },
  },
];
