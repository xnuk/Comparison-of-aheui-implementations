import { join } from 'https://deno.land/std@0.71.0/path/mod.ts'
import Mustache from 'https://raw.githubusercontent.com/janl/mustache.js/v4.0.1/mustache.mjs'

const { readTextFile, readDir } = Deno

type FileEntries = readonly { readonly name: string, readonly file: string }[]

const files = async (dir: string, pattern: RegExp): Promise<FileEntries> => {
	const result = []

	for await (const { name, isFile } of readDir(dir)) {
		if (!(isFile && pattern.test(name))) continue

		result.push({
			name: name.replace(
				pattern, (_, p) => typeof p === 'string' ? p : ''
			),
			file: await readTextFile(join(dir, name))
		})
	}

	return result.sort((a, b) => a.name > b.name ? 1 : -1)
}

const naiveYamlParser = (yaml: string) => {
	const meta = {} as { [key: string]: string }
	let key = ''

	for (const line of yaml.split(/\r?\n/)) {
		if (line.trim() === '#' || line.startsWith('# ')) continue

		const value = line.replace(/^([-_a-z]{2,}):/i, (_, p) => {
			key = p
			return ''
		}).trim()

		if (key.length === 0) continue

		if (meta[key] == null) meta[key] = value
		else if (/^-? /.test(line)) meta[key] += '\n' + line
	}

	return meta
} 

const utils = {
	withIndent: () => (text: string, render: (str: string) => string) => {
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

	strip: () => (text: string, render: (str: string) => string) =>
		render(text).trim(),

	meta: () => function (this: unknown, text: string) {
		Object.assign(this, naiveYamlParser(text))
	}
}

Mustache.escape = <T>(x: T): T => x
Mustache.tags = ['[[', ']]']

const render = (mustaches: FileEntries, impls: FileEntries) => {
	const templates = Object.fromEntries(
		mustaches.map(v => [v.name, v.file] as const)
	)

	const data = {
		files: impls.map(({ name, file }) => {
			const meta = naiveYamlParser(file)

			return {
				repo: name.replace(/\./g, '/'),
				revision: 'v1',
				name: name.replace(/\./g, '--'),
				get ref() {
					throw `'ref' should be given for ${name}`
				},
				...meta,
			}
		}),
		...utils
	}

	return Mustache.render(templates.main, data, templates)
}

const die = (x: string) => (
	console.error(x),
	Deno.exit(1)
)

const orDie = <T>(promise: Promise<T>): Promise<T> =>
	promise.catch(die)


if (import.meta.main) {
	const [templateDir, implDir] = Deno.args

	if (templateDir == null || implDir == null)
		die(`Usage: ${Deno.mainModule} [templateDir] [implDir]`)

	const mustaches = orDie(files(templateDir, /\.mustache\.yaml$/))
	const impls = orDie(files(implDir, /\.yaml$/))

	orDie((async () =>
		console.log(render(await mustaches, await impls))
	)())
}
