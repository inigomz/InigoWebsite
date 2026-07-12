module.exports = {
  root: true,
  extends: ['airbnb'],
  plugins: ['react-hooks'],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'max-len': ['error', { code: 120 }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-param-reassign': ['error', { props: false }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['vite.config.js', 'vitest.setup.js', '**/*.test.js', '**/*.test.jsx'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['vitest.setup.js'],
      rules: {
        'class-methods-use-this': 'off',
      },
    },
    {
      files: ['**/*.test.js', '**/*.test.jsx'],
      rules: {
        'no-await-in-loop': 'off',
        'no-restricted-syntax': 'off',
        'no-underscore-dangle': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['src/components/ParallaxLayer.jsx', 'src/components/Reveal.jsx'],
      rules: {
        'no-restricted-syntax': 'off',
        'react/jsx-props-no-spreading': 'off',
      },
    },
    {
      files: ['src/components/ThemeToggle.jsx'],
      rules: {
        'max-len': 'off',
      },
    },
    {
      files: ['src/components/GitHubRepos.jsx', 'src/routes/Home.jsx'],
      rules: {
        'react/no-array-index-key': 'off',
      },
    },
    {
      files: ['src/content/loader.js'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
