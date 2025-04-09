const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');

const config = getDefaultConfig(__dirname);
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("@lingui/metro-transformer/expo"),
};

config.resolver = {
  ...resolver,
  sourceExts: [...resolver.sourceExts, 'svg'],
  extraNodeModules: {
    '@noble/hashes': path.resolve(__dirname, 'node_modules/@noble/hashes'),
    crypto: path.resolve(__dirname, 'node_modules/@noble/hashes/crypto'),
  },
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === '@noble/hashes/crypto.js' || moduleName === '@noble/hashes/crypto') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/@noble/hashes/crypto.js'),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;