import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.app.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@angular-eslint': angular,
    },
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.spec.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@angular-eslint': angular,
    },
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
];
