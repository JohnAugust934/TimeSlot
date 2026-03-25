module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['.next', 'node_modules'],
};
