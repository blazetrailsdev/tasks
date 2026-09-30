---
title: "activerecord: audit the 41 PERMANENT receipts in associations/"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 41 of them:

- `associations/alias-tracker.ts:37` `@noRailsEquivalent` — `export class AliasCounts extends Map<string, number> {`
- `associations/alias-tracker.ts:39` `@noRailsEquivalent` — `defaultProc: (h: AliasCounts, k: string) => number;`
- `associations/alias-tracker.ts:47` `@noRailsEquivalent` — `override get(key: string): number {`
- `associations/association-scope.ts:204` `@missingRailsCall` — `private addConstraints(scope: unknown, owner: Base, chain: Array<Chain`
- `associations/association.ts:294` `@missingRailsCall` — `marshalDump(): [string, Record<string, unknown>] {`
- `associations/association.ts:516` `@missingRailsCall` — `protected targetScope(): any {`
- `associations/belongs-to-association.ts:13` `@missingRailsCall` — `async handleDependency(): Promise<void> {`
- `associations/belongs-to-association.ts:74` `@missingRailsName` — `async default(block: (owner: Base) => Base | null | Promise<Base | nul`
- `associations/belongs-to-association.ts:248` `@missingRailsName` — `protected replaceKeys(record: Base | null, { force = false }: { force?`
- `associations/belongs-to-polymorphic-association.ts:64` `@missingRailsName` — `protected override inverseReflectionFor(record: Base): unknown {`
- `associations/collection-association.ts:69` `@missingRailsCall` — `async idsReader(): Promise<unknown[]> {`
- `associations/collection-association.ts:101` `@missingRailsName` — `async idsWriter(ids: unknown[]): Promise<void> {`
- `associations/collection-association.ts:153` `@missingRailsName` — `async find(...args: unknown[]): Promise<Base | Base[] | null> {`
- `associations/collection-association.ts:372` `@missingRailsCall` — `size(): Promise<number> | number {`
- `associations/collection-proxy.ts:35` `@noRailsEquivalent` — `then<TResult1 = T[], TResult2 = never>(`
- `associations/collection-proxy.ts:40` `@noRailsEquivalent` — `catch<TResult = never>(`
- `associations/collection-proxy.ts:44` `@noRailsEquivalent` — `finally(onfinally?: (() => void) | null): Promise<T[]>;`
- `associations/collection-proxy.ts:149` `@noRailsEquivalent` — `[Symbol.iterator](): IterableIterator<T> {`
- `associations/collection-proxy.ts:511` `@noRailsEquivalent` — `async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {`
- `associations/foreign-association.ts:20` `@missingRailsCall` — `static nullifiedOwnerAttributes(`
- `associations/has-many-association.ts:51` `@missingRailsCall` — `async handleDependency(): Promise<void> {`
- `associations/has-many-association.ts:52` `@missingRailsCall` — `async handleDependency(): Promise<void> {`
- `associations/has-many-through-association.ts:126` `@missingRailsCall` — `override buildRecord(`
- `associations/has-many-through-association.ts:127` `@missingRailsName` — `override buildRecord(`
- `associations/has-many-through-association.ts:187` `@missingRailsCall` — `protected override async deleteRecords(records: Base[], method: string`
- `associations/has-one-association.ts:46` `@missingRailsCall` — `async delete(`
- `associations/join-dependency.ts:231` `@missingRailsCall` — `private walk(`
- `associations/join-dependency.ts:398` `@missingRailsCall` — `applyColumnAliases(relation: any): any {`
- `associations/join-dependency.ts:409` `@noRailsEquivalent` — `[Symbol.iterator](): Iterator<JoinPart> {`
- `associations/preloader.ts:33` `@noRailsEquivalent` — `static new(options: PreloaderOptions): Preloader {`
- `associations/builder/belongs-to.ts:117` `@missingRailsCall` — `static async touchRecord(`
- `associations/builder/belongs-to.ts:253` `@missingRailsCall` — `static override defineValidations(model: any, reflection: any): void {`
- `associations/builder/has-and-belongs-to-many.ts:25` `@missingRailsCall` — `throughModel(): any {`
- `associations/join-dependency/join-association.ts:49` `@missingRailsCall` — `joinConstraints(`
- `associations/join-dependency/join-association.ts:50` `@missingRailsCall` — `joinConstraints(`
- `associations/join-dependency/join-part.ts:42` `@noRailsEquivalent` — `yield this;`
- `associations/preloader/through-association.ts:34` `@missingRailsCall` — `async recordsByOwner(): Promise<Map<Base, Base[]>> {`
- `associations/preloader/through-association.ts:35` `@missingRailsCall` — `async recordsByOwner(): Promise<Map<Base, Base[]>> {`
- `associations/preloader/through-association.ts:103` `@missingRailsCall` — `async futureClasses(): Promise<(typeof Base)[]> {`
- `associations/preloader/through-association.ts:197` `@missingRailsCall` — `private async sourceRecordsByOwner(): Promise<Map<Base, Base[]>> {`
- `associations/preloader/through-association.ts:207` `@missingRailsCall` — `private async throughRecordsByOwner(): Promise<Map<Base, Base[]>> {`

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
