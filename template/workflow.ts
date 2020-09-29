import { version, definitions } from './workflow-v1.0.json'

if (version !== 'workflow-v1.0') process.exit(1)

type Entries<T> = ({ [K in keyof T]: [K, T[K]] }[keyof T])[]

const entries: <T>(v: T) => Entries<T> = Object.entries
const withEntries = <T extends {[key: string]: any}, F>(
	v: T, func: (value: T[keyof T], key: keyof T) => F
) => Object.fromEntries(
	entries(v).map(
		([k, v]) => [k, func(v, k)]
	)
) as {[key in keyof T]: F}

type AllKeys<T> = T extends (infer A | infer B) ? (keyof A | keyof B) : keyof T

type Normalize<T> = { [K in keyof T]: T[K] }
type FillUndefined<T, P> =
	T extends any[] ? T :
	T extends {[key: string]: any} ? Normalize<T & { [K in Exclude<AllKeys<P>, keyof T>]: undefined }> :
	T

type PreAnswer<T, P = T> = T extends (infer A | infer B) ? (FillUndefined<A, P> | FillUndefined<B, P>) : FillUndefined<T, P>
type Opt<T> = PreAnswer<T>

const stripVoid = <T>(a: T) => Object.fromEntries(entries(a).filter(x => x[1] !== undefined)) as { [K in keyof T]-?: Exclude<T[K], undefined> }

const id = <T>(x: T) => x as Opt<T>

const getType = <T extends string>(type: T): { type: T } | { '$ref': string } | {} => (
	type in definitions ? { '$ref': `#/definitions/${type}` }
	: type === 'any' ? {}
	: type === 'sequence' ? { type: 'array' }
	: type === 'mapping' ? { type: 'object' }
	: { type }
)

const schema = {
	'$schema': 'http://json-schema.org/draft-07/schema#',
	...getType('workflow-root'),
	definitions: {
	...withEntries(definitions, value => {
		const description = 'description' in value ? value.description : undefined
		const mapping = 'mapping' in value ? value.mapping : undefined

		const additionalProperties = !mapping ? undefined :
			'loose-key-type' in mapping
				? getType(mapping['loose-value-type'])
				: false

		const properties = mapping && 'properties' in mapping
			? (() => {
				const required = [] as string[]
				const properties = withEntries(id(mapping.properties), (value, key) => {
					if (value == null) return value
					if (typeof value === 'string') return getType(value)
					if ('type' in value && 'required' in value) {
						if (value.required) required.push(key)
						return getType(value.type)
					}

					const assertNever: never = value
					return assertNever
				})

				return required.length === 0 ? {properties} : {required, properties}
			})()
			: null

		const oneOf = 'one-of' in value
			? (value['one-of'] as string[]).map(getType)
			: undefined

		const type = oneOf != null ? {}
		: mapping != null ? { type: 'object' } as const
		: 'string' in value ? {
			type: 'string',
			...(
				'require-non-empty' in value.string &&
				value.string['require-non-empty']
				? { minLength: 1 } as const
				: null
			)
		} as const
		: 'sequence' in value ? {
			type: 'array',
			items: getType(value.sequence['item-type'])
		} as const
		: 'number' in value ? { type: 'number' } as const
		: 'boolean' in value ? { type: 'boolean' } as const
		: {}

		return stripVoid({ description, ...properties, additionalProperties, oneOf, ...type } as const)
	}),
	}
}

console.log(JSON.stringify(schema, null, 2))

