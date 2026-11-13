const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// In react-native-reanimated 4.1.x, package.json specifies "react-native": "src/index",
// but published npm packages distribute the compiled code under "lib/module/index".
// Metro prioritizes the "react-native" field, which causes "Unable to resolve react-native-reanimated".
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-reanimated") {
    return context.resolveRequest(
      context,
      "react-native-reanimated/lib/module/index",
      platform,
    );
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
