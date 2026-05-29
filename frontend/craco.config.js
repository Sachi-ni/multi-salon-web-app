const { getLoaders, loaderByName } = require('@craco/craco');

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
};
