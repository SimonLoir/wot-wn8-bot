const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = [
    {
        target: 'node',
        entry: {
            app: './src/index.ts',
        },
        module: {
            rules: [
                {
                    test: /\.ts?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, '.'),
        },
        watch: true,
        externals: nodeExternals(),
    },
];
