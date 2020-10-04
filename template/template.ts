#!/usr/bin/env node
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'
import { execFile } from 'child_process'
import * as M from 'mustache'
import { load as unsafeParseYaml, JSON_SCHEMA } from 'js-yaml'

const Mustache = M as { -readonly [key in keyof typeof M]: (typeof M)[key] }

const run = promisify(execFile)

const readTextFile = (path: string) => readFile(path, 'utf8')

const parseYaml = (str: string): unknown =>
	unsafeParseYaml(str, { schema: JSON_SCHEMA })

const readYamls = async <T>(
	dir: string,
	map: (text: string, name: string) => Promise<T> | T,
): Promise<T[]> => Promise.all(
	(await readdir(dir, { encoding: 'utf8', withFileTypes: true }))
	.filter(path => path.isFile() && path.name.endsWith('.yaml'))
	.map(path => path.name)
	.sort()
	.map(async name =>
		map(
			await readTextFile(join(dir, name)),
			name.replace(/\.ya?ml$/, '')
		)
	)
)

const mixins: {
	[name: string]: () => (
		this: { [key: string]: unknown },
		text: string,
		render: (str: string) => string,
	) => string
} = {
	withIndent: () => (text, render) => {
		const lines = text.split(/\r?\n/).slice(1)
		const indent = lines
			.filter(line => line.trim().length > 0)[0]
			.match(/^(\s*)[^\s]/)?.[1] ?? ''

		const subsection = render(
			lines.map(line =>
				line.startsWith(indent)
					? line.slice(indent.length)
					: line
			).join('\n')
		)

		const indented = subsection.split('\n').map(line =>
			line.length === 0 ? '' : indent + line
		).join('\n')

		return indented
	},

	strip: () => (text, render) => render(text).trim(),
	render: () => (text, render) => render(render(text)),
}

const isObject = (x: unknown): x is {[key: string]: unknown} =>
	typeof x === 'object' && x != null

const impls = (dir: string) =>
	readYamls(dir, (text, name) => {
		const data = parseYaml(text)

		if (!(
			isObject(data) &&
			typeof data.ref === 'string' &&
			Array.isArray(data.steps)
		))
			return Promise.reject(`${name} is not an valid format`)

		const steps = data.steps.map((step: unknown) => {
			if (!isObject(step)) return step
			const when = typeof step.if === 'string' && step.if.trim() !== ''
				? `(${step.if}) && ` : ''

			return JSON.stringify({
				...step, 'if': when + '[[if-cache-miss]]'
			})
		})

		return {
			repo: name.replace(/\./g, '/'),
			revision: 'v1',
			name: name.replace(/\./g, '--'),
			...data,

			steps,
		}
	})

const main = async () => {
	const cdup = await run('git', ['rev-parse', '--show-toplevel'], {
		cwd: __dirname
	})

	const gitRoot = cdup.stdout.replace(/\r?\n$/, '')

	const impl = impls(join(gitRoot, 'impl'))
	const template = readTextFile(join(gitRoot, 'template/main.mustache.yaml'))

	Mustache.escape = <T>(x: T): T => x
	Mustache.tags = ['[[', ']]']

	let data: { [key: string]: unknown } = {
		files: await impl,
		...mixins,
		meta: () => function (this: any, text: string) {
			data = Object.assign(this, parseYaml(text))
			return ''
		}
	}

	return Mustache.render(await template, data, new Proxy({}, {
		get(_, key: string) {
			if (data == null) return ''

			const value = data[key]
			if (typeof value === 'function') return ''
			if (typeof value === 'string') return value
			if (value == null) return value
			return JSON.stringify(value)
		}
	}))
}

main().then(console.log)
