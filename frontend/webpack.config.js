const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env) => {
    return {
        entry: './src/index.js',
        output: {
            path: path.join(__dirname, '/dist'),
            filename: 'bundle.js',
            publicPath: '',
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "src/index.html"
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                    },
                },
                {
                    test: /\.(scss)$/,
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader'
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: () => [
                                        require('autoprefixer')
                                    ]
                                }
                            }
                        },
                        {
                            loader: 'sass-loader'
                        }
                    ]
                }
            ],
        },
        devServer: {
            hot: true,
            port: 5001,
            open: true,
            proxy: {
                '/backend': {
                    target: env.BACKEND_URL || 'http://localhost:5000'
                },
            }
        },
    }
}