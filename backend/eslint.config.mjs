import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-namespace': [
        'error',
        { allowDeclarations: true }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  }
);
