# Test Coverage Configuration
# https://vitest.dev/guide/coverage.html

export default {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  reportsDirectory: './coverage',
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mock*',
    '**/setup.ts',
    '**/utils/**',
    '.next/',
    'dist/',
    '.wrangler/',
    'scripts/',
  ],
  thresholds: {
    statements: 60,
    branches: 50,
    functions: 50,
    lines: 60,
  },
  all: true,
  include: ['lib/**', 'app/**', 'components/**'],
};