import oclif from 'eslint-config-oclif'

export default [
  ...oclif,
  {
    ignores: [
      './assets',
      './lib',
      '**/*.js',
    ],
  },
  {
    files: [
      '**/*.ts',
    ],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          modules: true,
        },
        ecmaVersion: 6,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      camelcase: 'off',
      'import/namespace': 'warn',
      'mocha/no-mocha-arrows': 'warn',
      'n/shebang': 'warn',
      'node/no-missing-import': 'off',
      'perfectionist/sort-imports': 'warn',
      'perfectionist/sort-named-imports': 'warn',
      'perfectionist/sort-objects': 'warn',
      'prefer-arrow-callback': 'warn',
      'unicorn/import-style': 'warn',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/prefer-module': 'warn',
      'unicorn/prefer-node-protocol': 'warn',
      'unicorn/prefer-number-properties': 'warn',
    },
  },
]
