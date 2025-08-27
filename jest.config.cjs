/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.cjs'],

  // Coverage collection
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/tests/**/*'],

  // Coverage thresholds for auto-publishing
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 75,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Handle ES modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};

module.exports = config;
