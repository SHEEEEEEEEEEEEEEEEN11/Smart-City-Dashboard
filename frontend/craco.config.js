module.exports = {
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.csv$/,
            loader: 'raw-loader',
          },
        ],
      },
    },
  },
};
