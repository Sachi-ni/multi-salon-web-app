const { getLoaders, loaderByName } = require('@craco/craco');

// Suppress specific Node.js deprecation warnings from dependencies
const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'DeprecationWarning' &&
    data.code === 'DEP0176'
  ) {
    return false;
  }
  return originalEmit.apply(process, arguments);
};


module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const { hasFoundAny, matches } = getLoaders(
        webpackConfig,
        loaderByName('postcss-loader')
      );

      if (hasFoundAny) {
        matches.forEach((match) => {
          if (match.loader && match.loader.options && match.loader.options.postcssOptions) {
            // Replace the plugins array entirely with properly initialized plugins
            match.loader.options.postcssOptions.plugins = [
              require('tailwindcss'),
              require('autoprefixer'),
              require('postcss-flexbugs-fixes'),
              [
                require('postcss-preset-env'),
                {
                  autoprefixer: { flexbox: 'no-2009' },
                  stage: 3,
                },
              ],
            ];
          }
        });
      }

      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    const onBeforeSetupMiddleware = devServerConfig.onBeforeSetupMiddleware;
    const onAfterSetupMiddleware = devServerConfig.onAfterSetupMiddleware;

    if (onBeforeSetupMiddleware || onAfterSetupMiddleware) {
      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        if (!devServer) {
          throw new Error("webpack-dev-server is not defined");
        }

        if (onBeforeSetupMiddleware) {
          onBeforeSetupMiddleware(devServer, devServer);
        }

        if (onAfterSetupMiddleware) {
          onAfterSetupMiddleware(devServer, devServer);
        }

        return middlewares;
      };

      delete devServerConfig.onBeforeSetupMiddleware;
      delete devServerConfig.onAfterSetupMiddleware;
    }

    return devServerConfig;
  },
};
