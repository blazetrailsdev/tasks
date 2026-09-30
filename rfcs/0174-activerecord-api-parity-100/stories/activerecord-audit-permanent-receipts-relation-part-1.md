---
title: "activerecord: audit the 42 PERMANENT receipts in relation.ts and relation/ (part 1)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

100% parity leaves only receipts ratified in CLAUDE.md. activerecord carries **417** PERMANENT
receipts (`@noRailsEquivalent` 136, `@missingRailsCall`
194, `@missingRailsArgs` 27,
`@missingRailsName` 60). The token carries no prose, so nothing
records which ratified section each rests on — and RFC 0120's `burn-down-and-enroll-activerecord` warned
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 42 of them:

- `relation.ts:239` `@noRailsEquivalent` — `catch<TResult = never>(`
- `relation.ts:243` `@noRailsEquivalent` — `finally(onfinally?: (() => void) | null): Promise<string>;`
- `relation.ts:464` `@missingRailsCall` — `loadAsync(): Relation<T> {`
- `relation.ts:594` `@noRailsEquivalent` — `async presence(): Promise<LoadedRelation<Relation<T>> | null> {`
- `relation.ts:715` `@missingRailsCall` — `private referencesEagerLoadedTables(): boolean {`
- `relation.ts:746` `@noRailsEquivalent` — `async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {`
- `relation.ts:1081` `@missingRailsCall` — `toSql(): string {`
- `relation.ts:1082` `@missingRailsCall` — `toSql(): string {`
- `relation.ts:1083` `@missingRailsArgs` — `toSql(): string {`
- `relation.ts:1516` `@missingRailsName` — `valuesForQueries(): Record<string, unknown> {`
- `relation.ts:1591` `@missingRailsArgs` — `async findByTokenFor(purpose: string, token: string): Promise<T | null`
- `relation.ts:1610` `@missingRailsArgs` — `async findByTokenForBang(purpose: string, token: string): Promise<T> {`
- `relation.ts:1657` `@missingRailsArgs` — `async computeCacheVersion(timestampColumn = "updated_at"): Promise<str`
- `relation.ts:1882` `@noRailsEquivalent` — `catch<TResult = never>(`
- `relation.ts:1886` `@noRailsEquivalent` — `finally(onfinally?: (() => void) | null): Promise<T[]>;`
- `relation/batches.ts:276` `@missingRailsCall` — `export async function ensureValidOptionsForBatchingBang(`
- `relation/batches.ts:431` `@missingRailsCall` — `export function recordCursorValues(record: any, cursor: string[]): unk`
- `relation/calculations.ts:381` `@missingRailsName` — `export async function pluck(`
- `relation/calculations.ts:749` `@missingRailsCall` — `export async function executeSimpleCalculation(`
- `relation/calculations.ts:819` `@missingRailsArgs` — `export async function executeGroupedCalculation(`
- `relation/calculations.ts:963` `@missingRailsArgs` — `export function lookupCastTypeFromJoinDependencies(`
- `relation/calculations.ts:981` `@missingRailsCall` — `export async function typeCastPluckValues(`
- `relation/delegation.ts:44` `@missingRailsArgs` — `export function uncacheableMethods(): Set<string> {`
- `relation/delegation.ts:69` `@missingRailsArgs` — `static initializeRelationDelegateCache(this: typeof Base): void {`
- `relation/delegation.ts:114` `@missingRailsCall` — `generateMethod(method: string): void {`
- `relation/delegation.ts:115` `@missingRailsCall` — `generateMethod(method: string): void {`
- `relation/delegation.ts:116` `@missingRailsCall` — `generateMethod(method: string): void {`
- `relation/finder-methods.ts:226` `@missingRailsCall` — `export async function findNthFromLast(this: FinderRelation, index: num`
- `relation/finder-methods.ts:294` `@missingRailsCall` — `export async function isExists(`
- `relation/finder-methods.ts:346` `@missingRailsCall` — `export function raiseRecordNotFoundExceptionBang(`
- `relation/finder-methods.ts:347` `@missingRailsName` — `export function raiseRecordNotFoundExceptionBang(`
- `relation/finder-methods.ts:491` `@missingRailsCall` — `export async function findWithIds(this: FinderRelation, ...ids: unknow`
- `relation/finder-methods.ts:492` `@missingRailsArgs` — `export async function findWithIds(this: FinderRelation, ...ids: unknow`
- `relation/finder-methods.ts:552` `@missingRailsName` — `export async function findSome(this: FinderRelation, ids: unknown[]):`
- `relation/finder-methods.ts:585` `@missingRailsName` — `export async function findSomeOrdered(this: FinderRelation, ids: unkno`
- `relation/finder-methods.ts:618` `@missingRailsCall` — `export async function findTake(this: FinderRelation): Promise<any | nu`
- `relation/finder-methods.ts:628` `@missingRailsCall` — `export async function findTakeWithLimit(this: FinderRelation, limit: n`
- `relation/finder-methods.ts:637` `@missingRailsCall` — `export async function findNth(this: FinderRelation, index: number): Pr`
- `relation/finder-methods.ts:651` `@missingRailsCall` — `export async function findLast(this: FinderRelation, limit?: number):`
- `relation/finder-methods.ts:661` `@missingRailsCall` — `export function orderedRelation(this: FinderRelation): any {`
- `relation/merger.ts:66` `@missingRailsCall` — `private mergeSelectValues(rel: any): void {`
- `relation/merger.ts:75` `@missingRailsCall` — `private mergePreloads(rel: any): void {`

Ratified sections that can back an activerecord receipt: § "Generated attribute readers are
properties", § "Serialization's dual sync/async hash", § "`Relation` is evaluated by an async query",
§ "Override arity", § "Call-time constant resolution", § "The pool monitor guards only sections that span
an `await`", § "Method visibility is a side table", § "Schema reflection peeks at a warm cache" (the peek
only — its scope boundary excludes every synchronous lease), § "The adapter lock defaults to a monitor",
§ "Records are not Proxies", § "Ruby protocol methods with a different JS mechanism", § "`inherited` is
deferred", § "`singleton_class` is a per-object subclass", § "A create path awaits its block", § "Trails has
no autoloader".

## Acceptance criteria

- [ ] The PR body tables every receipt above against the CLAUDE.md section that ratifies it.
- [ ] Every receipt with no ratifying section converges in this story, or is split into its own story (`pnpm tasks new 0174-activerecord-api-parity-100 <slug> --body-file …` with the Rails `file:line`) and re-tagged `CONVERGEABLE <slug>` in the same PR.
- [ ] A `@missingRailsName` receipt whose pair `classifyPair` now files as convergeable is renamed (the naming gate reds a receipt on a convergeable pair).
- [ ] `pnpm parity:api:extra:gate` (rowless), `:calls`, `:calls:args`, `:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
