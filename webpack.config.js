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
    path: 'lib/',
    filename: 'react-slider.js',
    libraryTarget: 'commonjs2'
  },
  entry: {
    index: './index.js'
  }
}