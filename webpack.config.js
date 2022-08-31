const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: '/client/index.js',
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'bundle.js',
	},
  mode: process.env.NODE_ENV,
  module: {
		rules: [
			{
				test: /\.jsx?/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react'],
					},
				},
			},
			{
				test: /\.(s?)css$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
		],
	},
  plugins: [new HtmlWebpackPlugin({ template: './client/index.html' })],
	devServer: {
		static: {
			directory: path.join(__dirname, 'build'),
			publicPath: '/build',
		},
		proxy: {
			// redirect localhost:3000* requests to localhost:8080*
			'/upload': 'http://localhost:3000/',
      '/files': 'http://localhost:3000/',
			'/modify': 'http://localhost:3000/',
			'/processed': 'http://localhost:3000/',
			'/checkForUserFiles': 'http://localhost:3000/'
			// '/api/leaders': 'http://localhost:3000',
		},
	},
};