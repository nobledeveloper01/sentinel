module.exports = {
  // RN 0.87 moved the preset out of the `react-native` package itself.
  preset: '@react-native/jest-preset',
  // The domain package is TypeScript source consumed directly, exactly as
  // Metro consumes it, so a test and the app agree about what they run.
  moduleNameMapper: {
    '^@sentinel/domain$': '<rootDir>/../../packages/domain/src/index.ts',
    '^@sentinel/crypto$': '<rootDir>/../../packages/crypto/src/index.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!(@react-native|react-native|@sentinel)/)'],
};
