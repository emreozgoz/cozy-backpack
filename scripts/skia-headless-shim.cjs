// Lets art components that import '@shopify/react-native-skia' run in Node:
// the headless build plus the `Skia` instance the app gets from the native module,
// and the small pure helpers (vec, rect, rrect) the main entry re-exports.
// Requires globalThis.CanvasKit to be initialised first.
const headless = require('@shopify/react-native-skia/lib/commonjs/headless');

const { Skia } = headless.getSkiaExports();
// The helpers below reach for the global the native module normally installs.
globalThis.SkiaApi = Skia;

const vector = require('@shopify/react-native-skia/lib/commonjs/skia/core/Vector');
const rect = require('@shopify/react-native-skia/lib/commonjs/skia/core/Rect');
const rrect = require('@shopify/react-native-skia/lib/commonjs/skia/core/RRect');

module.exports = { ...headless, ...vector, ...rect, ...rrect, Skia };
