---
title: "activemodel: audit the 50 PERMANENT receipts in top-level src files"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

100% parity leaves only receipts a CLAUDE.md section ratifies. activemodel carries **76**
PERMANENT receipts (`@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` /
`@missingRailsName`); a PERMANENT token carries no prose, so nothing records which ratified section
each rests on. This story takes the 50 in top-level `packages/activemodel/src/*.ts`:

- `access.ts:9` `@missingRailsArgs` — `slice(...methods: (string | string[])[]): HashWithIndifferentAccess<unknown> {`
- `attribute-assignment.ts:122` `@noRailsEquivalent` — `export function assertAssignedSynchronously(`
- `attribute-methods.ts:360` `@missingRailsArgs` — `attributeMethodPatternsCache(this: ClassMethodsHost): Map<string, Array<Attribut`
- `attribute-methods.ts:451` `@missingRailsCall` — `methodMissing(this: InstanceMethodsHost, method: string, ...args: unknown[]): un`
- `attribute-methods.ts:550` `@noRailsEquivalent` — `function generateMethodFor(pattern: AttributeMethodPattern): string {`
- `attribute-methods.ts:570` `@noRailsEquivalent` — `function extractParameters(`
- `attribute-methods.ts:580` `@noRailsEquivalent` — `function answersWithAMethod(klass: unknown, name: string): boolean {`
- `attribute-methods.ts:608` `@noRailsEquivalent` — `export function completeHalfAccessor(`
- `attribute-methods.ts:622` `@noRailsEquivalent` — `export function defineMethodAttribute(`
- `attribute-methods.ts:658` `@noRailsEquivalent` — `export function initInternals(this: { constructor: ClassMethodsHost }, super_: (`
- `attribute-set.ts:15` `@noRailsEquivalent` — `function frozenErrorRaisingStore(attributes: Record<string, Attribute>): Record<`
- `attribute-set.ts:185` `@missingRailsName` — `initializeDup(_: AttributeSet): void {`
- `attribute-set.ts:194` `@noRailsEquivalent` — `for (const name of this.keys()) {`
- `attribute.ts:28` `@noRailsEquivalent` — `static readonly [rubyNamespace]: string = "ActiveModel";`
- `attribute.ts:124` `@missingRailsArgs` — `get valueForDatabase(): unknown {`
- `attribute.ts:229` `@missingRailsCall` — `initWith(coder: Coder): void {`
- `attribute.ts:254` `@missingRailsName` — `private initializeDup(_other: Attribute): void {`
- `attribute.ts:278` `@noRailsEquivalent` — `static readonly [rubyNamespace]: string = "ActiveModel::Attribute";`
- `attribute.ts:299` `@noRailsEquivalent` — `static readonly [rubyNamespace]: string = "ActiveModel::Attribute";`
- `attribute.ts:320` `@noRailsEquivalent` — `static readonly [rubyNamespace]: string = "ActiveModel::Attribute";`
- `attribute.ts:332` `@noRailsEquivalent` — `static readonly [rubyNamespace]: string = "ActiveModel::Attribute";`
- `attribute.ts:360` `@noRailsEquivalent` — `static readonly [rubyNamespace]: string = "ActiveModel::Attribute";`
- `attributes.ts:187` `@noRailsEquivalent` — `export type AttributesClassHalf = AttributeRegistrationClassHalf &`
- `attributes.ts:199` `@noRailsEquivalent` — `export type AttributeRegistrationClassHalf = Extended<typeof AttributeRegistrati`
- `attributes.ts:202` `@noRailsEquivalent` — `export type AttributeMethodsClassHalf = Extended<typeof AttributeMethodsClassMet`
- `bcrypt.ts:1` `@noRailsEquivalent` — `export class Engine {`
- `bcrypt.ts:3` `@noRailsEquivalent` — `static readonly MIN_COST: number = 4;`
- `bcrypt.ts:5` `@noRailsEquivalent` — `static readonly DEFAULT_COST: number = 12;`
- `bcrypt.ts:7` `@noRailsEquivalent` — `static cost: number = 12;`
- `callbacks.ts:74` `@noRailsEquivalent` — `const _defineModelCallbackByType: Record<string, (klass: CallbackHost, callback:`
- `callbacks.ts:166` `@noRailsEquivalent` — `function extractMacroOptions(`
- `dirty.ts:117` `@missingRailsName` — `get mutationsFromDatabase(): AttributeMutationTracker {`
- `errors.ts:80` `@missingRailsName` — `import(`
- `errors.ts:249` `@missingRailsName` — `fullMessage(attribute: string, message: string | null): string | null {`
- `errors.ts:254` `@missingRailsName` — `generateMessage(`
- `errors.ts:302` `@noRailsEquivalent` — `[Symbol.iterator](): IterableIterator<ActiveModelError> {`
- `gem-version.ts:13` `@missingRailsCall` — `export function gemVersion(): string {`
- `index.ts:78` `@noRailsEquivalent` — `export { Dirty, initAttributes as dirtyInitAttributes } from "./dirty.js";`
- `index.ts:90` `@noRailsEquivalent` — `export { typeRegistry } from "./type/registry.js";`
- `index.ts:146` `@noRailsEquivalent` — `export {`
- `lint.ts:4` `@noRailsEquivalent` — `export class MinitestAssertion extends globalThis.Error {`
- `model.ts:109` `@noRailsEquivalent` — `declare static moduleName?: string;`
- `model.ts:133` `@missingRailsCall` — `constructor(attributes: Record<string, unknown> = {}) {`
- `naming.ts:179` `@noRailsEquivalent` — `[Symbol.toPrimitive](_hint: string): string {`
- `naming.ts:276` `@noRailsEquivalent` — `function builtinClassName(value: unknown): string {`
- `serialization.ts:242` `@noRailsEquivalent` — `async function preloadIncludes(`
- `serialization.ts:295` `@noRailsEquivalent` — `export function asJsonThenable(`
- `serialization.ts:315` `@noRailsEquivalent` — `export function thenableHash(`
- `serialization.ts:371` `@noRailsEquivalent` — `function safeSet(target: Record<string, unknown>, key: string, value: unknown):`
- `validations.ts:419` `@noRailsEquivalent` — `export interface ConditionalOptions {`

Sections that can ratify an activemodel receipt: § "Generated attribute readers are properties",
§ "Serialization's dual sync/async hash", § "Method visibility is a side table", § "Override arity",
§ "Module mixins", § "Ruby protocol methods with a different JS mechanism". `bcrypt.ts` and
`gem-version.ts` are wrappers a gem port owns, not language shortcomings.

## Acceptance criteria

- [ ] The PR body tables each receipt against the CLAUDE.md section that ratifies it.
- [ ] Each receipt with no ratifying section converges in this story, or is split into its own story (`pnpm tasks new 0173-activemodel-parity-100 <slug> --body-file …`, citing the Rails `file:line`) and re-tagged `CONVERGEABLE <slug>` in the same PR.
- [ ] `pnpm parity:api:receipts:gate`, `:calls`, `:calls:args` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
