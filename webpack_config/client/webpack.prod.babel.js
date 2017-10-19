import webpack from 'webpack'
import rimraf from 'rimraf'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import ProgressPlugin from 'webpack/lib/ProgressPlugin'
import OfflinePlugin from 'offline-plugin'
import UglifyJSPlugin from 'uglifyjs-webpack-plugin'
import {Plugin as ShakePlugin} from 'webpack-common-shake'
import OptimizeJsPlugin from 'optimize-js-plugin'
// import git from 'git-rev-sync'
// import _ from 'lodash'
// NOTE: WebpackShellPlugin allows you to run custom shell commands before and after build
// import WebpackShellPlugin from 'webpack-shell-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import base from './webpack.base'
import config from '../config'
//
const {APP_LANGUAGE, ANALYZE_BUNDLE} = config

rimraf(`${config.distPath}/server/${APP_LANGUAGE}`, {}, () => {})
// NOTE: you can track versions with gitHash and store your build
// in dist folder with path like: /dist/client/<gitHash>/{yourFilesHere}
// const gitHash = git.short()

// Do you want to use bundle analyzer?
if (config.ANALYZE_BUNDLE) {
	base.plugins.push(new BundleAnalyzerPlugin({analyzerMode: 'static'}))
}

base.stats = {
	colors: true,
	// Add children information
	children: false,
	// Add chunk information (setting this to `false` allows for a less verbose output)
	chunks: false,
	// Add built modules information to chunk information
	chunkModules: false,
	chunkOrigins: false,
	modules: false,
	reasons: true,
	errorDetails: true
}

base.module.rules.push(
	{
		test: /\.css$/,
		use: ExtractTextPlugin.extract({
			fallback: 'style-loader',
			use: ['css-loader', 'postcss-loader']
		})
	},
	{
		test: /\.scss$/,
		use: ExtractTextPlugin.extract({
			fallback: 'style-loader',
			use: ['css-loader', 'postcss-loader', 'sass-loader']
		})
	}
)

// Production plugins
base.plugins.push(
	new ProgressPlugin(),
	new ExtractTextPlugin({
		filename: '[name].[chunkhash:8].css',
		allChunks: true
	}),
	new OptimizeCssAssetsPlugin({
		cssProcessorOptions: {
			safe: true,
			discardComments: {
				removeAll: true
			}
		}
	}),
	new webpack.optimize.ModuleConcatenationPlugin(),
	new ShakePlugin(),
	// NOTE: you can use BabiliPlugin as an alternative to UglifyJSPlugin
	// new BabiliPlugin(),
	new UglifyJSPlugin({
		sourceMap: true,
		compress: {
			unused: true,
			warnings: false,
			dead_code: true,
			drop_console: true
		},
		output: {
			comments: false
		}
	}),
	new OptimizeJsPlugin({
		sourceMap: true
	}),
	// NOTE: Prepack is currently in alpha, be carefull with it
	// new PrepackWebpackPlugin(),
	// extract vendor chunks
	new webpack.optimize.CommonsChunkPlugin({
		name: 'vendor',
		minChunks: module => {
			// this assumes your vendor imports exist in the node_modules directory
			return module.context && module.context.indexOf('node_modules') !== -1
		}
	}),
	// extract lazy containers chunk
	new webpack.optimize.CommonsChunkPlugin({
		name: 'lazy-containers',
		chunks: ['lazy-containers'],
		async: true
	}),
	// manifest chunk, more info in webpack docs
	new webpack.optimize.CommonsChunkPlugin({
		name: 'manifest'
	}),
	new CompressionPlugin({
		algorithm: 'gzip'
	}),
	new OfflinePlugin({
		caches: {
			main: [
				'vendor.*.js',
				'vendor.*.css',
				'manifest.*.js',
				'client.*.js',
				'assets/icons.*.*'
			],
			additional: [':externals:'],
			optional: [':rest:']
		},
		externals: [
			'/auth',
			'https://fonts.googleapis.com/css?family=Lato:400,700,400italic,700italic&subset=latin'
		],
		ServiceWorker: {
			events: true,
			navigateFallbackURL: '/auth?offline=true',
			navigateFallbackForRedirects: false
		},
		AppCache: false
	})
)

export default base
