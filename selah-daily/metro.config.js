// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build imports wa-sqlite.wasm, which Metro does not treat as
// an asset by default. The app ships to phones, but being able to render it in
// a browser is what makes it reviewable without a device in hand.
config.resolver.assetExts.push('wasm');

module.exports = config;
