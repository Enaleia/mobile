module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo"]
    ],
    plugins: [
      "@lingui/babel-plugin-lingui-macro",
      "nativewind/babel",
      "@babel/plugin-transform-export-namespace-from",
      "react-native-reanimated/plugin",
      "@babel/plugin-transform-runtime"
    ],
  };
};