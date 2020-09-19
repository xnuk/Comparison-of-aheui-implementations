#!/usr/bin/env node
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { safeLoad, JSON_SCHEMA } from 'js-yaml'

const yamls = async (dir: string) => {
	const paths = await readdir(
		dir,
		{ encoding: 'utf8', withFileTypes: true },
	)

	return await Promise.all(paths
		.filter(path => path.isFile() && path.name.endsWith('.yaml'))
		.map(async path => {
			const name = path.name.replace(/\.yaml$/, '');
			const file = await readFile(join(dir, path.name), 'utf8')

			const error = () => {
				throw new Error(
					`The YAML file ${path.name} is not valid`
				)
			}

			const parsed = safeLoad(file, { schema: JSON_SCHEMA })

			if (!(parsed && typeof parsed === 'object')) return error()

			const yaml = Object.assign(
				{ name },
				parsed,
			) as JobParam & { steps: { [key: string]: unknown }[] }

			const valid =
				'repo' in yaml &&
				'ref' in yaml &&
				'steps' in yaml &&
				Array.isArray(yaml.steps)

			return valid ? yaml : error()
		})
	)
}

const AHEUI_BIN = '$HOME/aheui'
const OS = 'ubuntu-20.04'
const TEST_PREFIX = 'test__'
const SNIPPETS_REF = 'ce34b1443a1c70b0cac1d8ed6304a65fee485082'

interface JobParam {
	readonly name: string
	readonly repo: string
	readonly ref: string
	readonly hash?: string
}
const jobP = ({name, repo, ref, hash = ''}: JobParam) => (
	type: 'compile' | 'test',
	steps: { [key: string]: unknown }[],
) => ({ [type === 'compile' ? name : TEST_PREFIX + name]: {
	needs: type === 'compile' ? [] : [name],
	env: { REPO: repo, REF: ref },
	'runs-on': OS,
	steps: [
		{ run: `echo "::set-env name=AHEUI_BIN::${AHEUI_BIN}"` },

		{
			id: 'cache',
			uses: 'actions/cache@v2',
			with: {
				path: '${{ env.AHEUI_BIN }}',
				key: [
					'aheui-bin-v1',
					'${{ env.REPO }}',
					'${{ env.REF }}',
					'${{ runner.os }}',
					hash,
				].join('-')
			}
		},

		...steps.map(step => Object.assign({}, step, {
			if: `steps.cache.outputs.cache-hit ${
				type === 'compile' ? '!=' : '=='
			} 'true'`,
		}))
	]
}}) as const

const job = (
	param: JobParam & { steps: { [key: string]: unknown }[] }
) => {
	const task = jobP(param)
	return [
		task('compile', [
			{
				uses: 'actions/checkout@v2',
				with: {
					repository: '${{ env.REPO }}',
					ref: '${{ env.REF }}',
				}
			},
			...param.steps
		]),

		task('test', [
			{
				uses: 'actions/checkout@v2',
				with: {
					repository: 'aheui/snippets',
					ref: SNIPPETS_REF,
				}
			},
			{ run: 'AHEUI="$AHEUI_BIN" bash test.sh standard' }
		])
	] as const
}

const result = async (dir: string) => ({
	name: 'compile-rev2',
	on: {
		push: {
			branches: [ 'actions' ],
			paths: [ '.github/workflows/benchmark.yaml' ],
		}
	},
	jobs: Object.assign({},
		...(await yamls(dir)).flatMap(job)
	)
})

result('./impl/').then(result =>
	console.log(JSON.stringify(result, null, 2))
)
