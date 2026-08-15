module.exports = {
  // The backend is its own project with its own eslint and its own copy of the
  // TypeScript plugin. Without this, linting from the repo root loads both that
  // copy and the root's, and ESLint 8 refuses to guess which one it means.
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  extends: ['airbnb-typescript/base', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
    // Relative to this file, not to wherever eslint was launched from, or a run
    // started at the repo root looks for a tsconfig.json that is not there.
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-param-reassign': 'off',
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'no-console': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'class-methods-use-this': 'off',
    '@typescript-eslint/naming-convention': 'off'
  },
};
