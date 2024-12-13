module.exports = function override(config, env) {
  // Add worker-loader
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: 'worker-loader' }
  });

  // Output filenames
  config.output.filename = 'static/js/[name].[contenthash:8].js';
  config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';

  return config;
};
