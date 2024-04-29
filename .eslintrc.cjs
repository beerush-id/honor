/** @type { import('eslint').Linter.Config } */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [ 'import', '@typescript-eslint' ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  rules: {
    'import/no-cycle': 'error',
  },
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
};
