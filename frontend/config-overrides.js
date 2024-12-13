module.exports = function override(config, env) {
  // Add worker-loader
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: 'worker-loader' }
  });

  // Output filenames
  config.output.filename = 'static/js/[name].[contenthash:8].js';
  config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';

  // Handle dev server configuration if in development mode
  if (env === 'development' && config.devServer) {
    config.devServer = {
      ...config.devServer,
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        // Add your middleware setup here if needed
        return middlewares;
      }
    };
  }

  return config;
};
