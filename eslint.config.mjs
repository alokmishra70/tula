import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.expo/**',
      'apps/mobile/expo-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
    },
  },
  {
    // Nest DI reads constructor types at runtime; keep those as value imports.
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      parserOptions: { emitDecoratorMetadata: true, experimentalDecorators: true },
    },
  },
  { ignores: ['apps/api/src/generated/**'] },
  {
    // Domain logic stays pure: no framework, ORM or SDK imports.
    files: ['apps/api/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@nestjs/*', '@prisma/*', '**/generated/**'], message: 'Keep domain/ pure.' },
            {
              group: ['**/modules/**', '**/infrastructure/**', '**/common/**'],
              message: 'Domain must not depend on outer layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.config.js'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser, __DEV__: 'readonly' } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react-native',
              allowTypeImports: true,
              message: 'Import icons from @/ui/icons so only used icons are bundled.',
            },
          ],
        },
      ],
    },
  },
  {
    // Every colour and size comes from the theme, so screens stay consistent.
    files: ['apps/mobile/**/*.{ts,tsx}'],
    ignores: [
      'apps/mobile/src/theme/**',
      'apps/mobile/**/*.test.{ts,tsx}',
      'apps/mobile/app.config.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^(#[0-9a-fA-F]{3,8}|rgba?\\()/]',
          message: 'Use a colour token from @/theme.',
        },
        {
          selector:
            "CallExpression[callee.property.name='create'] Property > Literal[raw=/^(?!0$|1$)\\d/]",
          message: 'Use a spacing, radius or layout token from @/theme.',
        },
        {
          selector: "JSXAttribute[name.name='style'] Property > Literal[raw=/^(?!0$|1$)\\d/]",
          message: 'Use a spacing, radius or layout token from @/theme.',
        },
      ],
    },
  },
  prettier,
);
