var version = require('./package.json').version;

module.exports = {
    entry: './lib',
    output: {
        filename: './dist/index.js',
        library: '@quantlab/services',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        publicPath: 'https://unpkg.com/@quantlab/services@' + version + '/dist/'
    },
    bail: true,
    devtool: 'source-map'
};
