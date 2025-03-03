module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Relaxed rules for development
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
};
