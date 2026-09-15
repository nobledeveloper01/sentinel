module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // The domain exposes its two halves as namespaces (`export * as circle`),
  // which the React Native preset does not transform on its own.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
