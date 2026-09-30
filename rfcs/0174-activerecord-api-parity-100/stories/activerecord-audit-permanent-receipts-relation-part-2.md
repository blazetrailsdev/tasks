---
title: "activerecord: audit the 42 PERMANENT receipts in relation.ts and relation/ (part 2)"
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

- `relation/merger.ts:114` `@missingRailsCall` — `private mergeJoins(rel: any): void {`
- `relation/merger.ts:144` `@missingRailsCall` — `private mergeOuterJoins(rel: any): void {`
- `relation/merger.ts:174` `@missingRailsCall` — `private mergeMultiValues(rel: any): void {`
- `relation/predicate-builder.ts:45` `@missingRailsArgs` — `protected expandFromHash(`
- `relation/predicate-builder.ts:198` `@missingRailsName` — `build(attribute: Arel.Attribute, value: unknown, operator: string | nu`
- `relation/predicate-builder.ts:339` `@missingRailsCall` — `private handlerFor(object: unknown): { call(attr: Arel.Attribute, valu`
- `relation/query-methods.ts:1429` `@missingRailsCall` — `export function buildSubquery(`
- `relation/query-methods.ts:1451` `@missingRailsCall` — `export function isDoesNotSupportReverse(order: string | Nodes.SqlLiter`
- `relation/query-methods.ts:1954` `@missingRailsCall` — `export function orderColumn(this: QueryMethodsHost, field: string): un`
- `relation/query-methods.ts:2137` `@missingRailsCall` — `export function buildJoinDependencies(this: QueryMethodsHost): JoinDep`
- `relation/query-methods.ts:2249` `@missingRailsCall` — `export function buildJoinBuckets(`
- `relation/query-methods.ts:2250` `@missingRailsName` — `export function buildJoinBuckets(`
- `relation/query-methods.ts:2334` `@missingRailsCall` — `export function buildJoins(`
- `relation/query-methods.ts:2366` `@missingRailsCall` — `export function buildWith(this: QueryMethodsHost, arel: any): void {`
- `relation/query-methods.ts:2384` `@missingRailsCall` — `export function buildWithJoinNode(`
- `relation/thenable.ts:4` `@noRailsEquivalent` — `export function stripThenable<T extends object>(obj: T): Omit<T, "then`
- `relation/thenable.ts:32` `@noRailsEquivalent` — `export function applyThenable(prototype: object, evaluationMethod: str`
- `relation/where-clause.ts:55` `@missingRailsCall` — `invert(): WhereClause {`
- `relation/where-clause.ts:56` `@missingRailsCall` — `invert(): WhereClause {`
- `relation/where-clause.ts:108` `@missingRailsCall` — `isContradiction(): boolean {`
- `relation/batches/batch-enumerator.ts:54` `@noRailsEquivalent` — `async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {`
- `relation/batches/batch-enumerator.ts:84` `@missingRailsCall` — `async deleteAll(): Promise<number> {`
- `relation/batches/batch-enumerator.ts:93` `@missingRailsCall` — `async updateAll(updates: Record<string, unknown>): Promise<number> {`
- `relation/batches/batch-enumerator.ts:102` `@missingRailsCall` — `async touchAll(...args: TouchAllArgs): Promise<number> {`
- `relation/batches/batch-enumerator.ts:114` `@missingRailsCall` — `async destroyAll(): Promise<number> {`
- `relation/batches/batch-enumerator.ts:115` `@missingRailsCall` — `async destroyAll(): Promise<number> {`
- `relation/batches/batch-enumerator.ts:156` `@noRailsEquivalent` — `then<TResult1 = T[], TResult2 = never>(`
- `relation/batches/batch-enumerator.ts:161` `@noRailsEquivalent` — `catch<TResult = never>(`
- `relation/batches/batch-enumerator.ts:165` `@noRailsEquivalent` — `finally(onfinally?: (() => void) | null): Promise<T[]>;`
- `relation/predicate-builder/association-query-value.ts:112` `@missingRailsCall` — `private isSelectClause(): boolean {`
- `relation/predicate-builder/basic-object-handler.ts:16` `@missingRailsName` — `call(attribute: Arel.Attribute, value: unknown): Nodes.Node {`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:6` `@noRailsEquivalent` — `export class DeferredIdsIn extends Nodes.In {`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:8` `@noRailsEquivalent` — `constructor(`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:12` `@noRailsEquivalent` — `readonly innerRelations: DeferredIds[],`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:18` `@noRailsEquivalent` — `invert(): DeferredIdsNotIn {`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:28` `@noRailsEquivalent` — `export class DeferredIdsNotIn extends Nodes.NotIn {`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:30` `@noRailsEquivalent` — `constructor(`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:34` `@noRailsEquivalent` — `readonly innerRelations: DeferredIds[],`
- `relation/predicate-builder/deferred-distinct-pk-in.ts:40` `@noRailsEquivalent` — `invert(): DeferredIdsIn {`
- `relation/predicate-builder/polymorphic-array-value.ts:34` `@missingRailsCall` — `queries(): Record<string, unknown>[] {`
- `relation/predicate-builder/range-handler.ts:50` `@missingRailsName` — `call(attribute: Arel.Attribute, value: Range<unknown>): Nodes.Node {`
- `relation/predicate-builder/relation-handler.ts:11` `@missingRailsCall` — `call(attribute: Arel.Attribute, value: any): Nodes.Node {`

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
