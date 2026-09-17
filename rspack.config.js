import path from 'node:path'
import { fileURLToPath } from 'node:url'
import rspack from '@rspack/core'
import { VueLoaderPlugin } from 'rspack-vue-loader'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

// GitHub Pages 项目站点需要子路径，本地/自建部署用默认 '/'
const publicPath = process.env.PUBLIC_PATH || '/'

/** @type {import('@rspack/core').Configuration} */
export default {
  mode: isProd ? 'production' : 'development',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProd ? 'assets/[name].[contenthash:8].js' : 'assets/[name].js',
    publicPath,
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        // Rspack 2.x 官方推荐：rspack-vue-loader fork，配套 inline match resource
        test: /\.vue$/,
        loader: 'rspack-vue-loader',
        options: { experimentalInlineMatchResource: true },
      },
      {
        test: /\.ts$/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: { parser: { syntax: 'typescript' }, target: 'es2020' },
        },
        type: 'javascript/auto',
      },
      {
        // rspack-vue-loader 会把 SFC 的 <style> 块重命名为 *.vue.css，
        // 这条规则同时覆盖普通 css 与 SFC 样式块
        test: /\.css$/,
        type: 'css',
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/[name].[hash:8][ext]' },
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    new rspack.DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(true),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
    }),
  ],
  devServer: {
    port: 5173,
    hot: true,
    historyApiFallback: true,
  },
  devtool: isProd ? false : 'eval-cheap-module-source-map',
  performance: { hints: false },
  stats: 'errors-warnings',
}
