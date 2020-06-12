import serve from 'rollup-plugin-serve'

let pkg = require('./package.json');

export default {
  	input: 'src/index.mjs',
  	output: {
		file: pkg.main,
		format: 'umd',
		name: 'yaz',
		sourcemap: true
	},
	plugins: [
		serve({
			contentBase: ['dist']
		})
	]
};