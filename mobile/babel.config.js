module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    plugins: [
      // Must stay last — it rewrites worklets and breaks if another plugin
      // runs after it.
      //
      // Was 'react-native-reanimated/plugin'. Reanimated 4 split the worklet
      // runtime into its own package, and the transform moved with it.
      'react-native-worklets/plugin',
    ],
  };
};
