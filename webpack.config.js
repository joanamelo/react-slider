module.exports = {
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: [
            'es2015',
            'react',
            'stage-0'
          ]
        }
      }
    ]
  },
  output: {
    path: 'dist/',
    filename: '[name].js'
  },
  entry: {
    index: './index.js'
  }
}