const { pipeline } = require('stream');
const { createReadStream, createWriteStream } = require('fs')

const path = process.argv[2]

pipeline(
	createReadStream(path),
	async function* (source) {
		yield Buffer.from('declare const data: ')
		yield* await source
		yield Buffer.from('\nexport = data')
	},
	createWriteStream(path + '.d.ts', { flags: 'wx' }),
	err => err && console.error(err)
)

