module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo"]
    ],
		plugins: ["@lingui/babel-plugin-lingui-macro", "nativewind/babel", "@babel/plugin-proposal-export-namespace-from", "react-native-reanimated/plugin"],
  };
};