const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web backend (wa-sqlite) ships a .wasm file; Metro doesn't treat wasm
// as an asset by default, which breaks bundling for the web target only (Android is
// unaffected — this is a pure additive fix).
config.resolver.assetExts.push('wasm');

module.exports = config;
