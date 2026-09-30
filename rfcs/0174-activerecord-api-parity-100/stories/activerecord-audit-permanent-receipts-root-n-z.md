---
title: "activerecord: audit the 37 PERMANENT receipts in top-level src files n–z"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 37 of them:

- `nested-attributes.ts:17` `@noRailsEquivalent` — `constructor(message?: string) {`
- `nested-attributes.ts:460` `@noRailsEquivalent` — `export const InstanceMethods = {`
- `no-touching.ts:24` `@missingRailsName` — `export function isNoTouching(this: Base): boolean {`
- `normalization.ts:67` `@noRailsEquivalent` — `export const InstanceMethods = {`
- `persistence.ts:656` `@missingRailsCall` — `export async function reload<T extends ReloadRecord>(`
- `persistence.ts:707` `@missingRailsName` — `export function becomes<`
- `persistence.ts:830` `@missingRailsName` — `export function _findRecord(`
- `persistence.ts:846` `@missingRailsCall` — `export function _inMemoryQueryConstraintsHash(`
- `persistence.ts:1123` `@noRailsEquivalent` — `export const InstanceMethods = {`
- `pretty-print.ts:1` `@noRailsEquivalent` — `import { rbAnyToS, rbInspect } from "@blazetrails/ruby-compat";`
- `readonly-attributes.ts:8` `@noRailsEquivalent` — `constructor(attribute: string) {`
- `result.ts:103` `@noRailsEquivalent` — `[Symbol.iterator](): IterableIterator<Record<string, unknown>> {`
- `result.ts:185` `@missingRailsCall` — `castValues(typeOverrides: ColumnTypes | ColumnType[] = {}): unknown[]`
- `result.ts:186` `@missingRailsCall` — `castValues(typeOverrides: ColumnTypes | ColumnType[] = {}): unknown[]`
- `result.ts:255` `@missingRailsArgs` — `export function columnType(`
- `schema-dumper.ts:140` `@noRailsEquivalent` — `static language: SchemaDumpLanguage = "ts";`
- `schema-dumper.ts:192` `@missingRailsCall` — `formattedVersion(): string {`
- `schema-dumper.ts:464` `@missingRailsCall` — `protected async checkConstraintsInCreate(`
- `schema-dumper.ts:599` `@missingRailsCall` — `async indexes(table: string, stream: IO | StringIO): Promise<void> {`
- `schema-dumper.ts:617` `@missingRailsCall` — `async indexesInCreate(table: string, stream: IO | StringIO): Promise<v`
- `schema-dumper.ts:678` `@missingRailsCall` — `async foreignKeys(table: string, stream: IO | StringIO): Promise<void>`
- `schema-dumper.ts:679` `@missingRailsCall` — `async foreignKeys(table: string, stream: IO | StringIO): Promise<void>`
- `schema.ts:63` `@missingRailsArgs` — `static get(version: string | number): typeof Migration {`
- `secure-password.ts:7` `@missingRailsCall` — `export async function authenticateBy(`
- `secure-token.ts:6` `@noRailsEquivalent` — `constructor(message?: string) {`
- `secure-token.ts:15` `@missingRailsCall` — `export function hasSecureToken(`
- `statement-cache.ts:148` `@missingRailsCall` — `static create(`
- `test-fixtures.ts:362` `@missingRailsName` — `async teardownTransactionalFixtures(): Promise<void> {`
- `timestamp.ts:101` `@missingRailsCall` — `export function currentTimeFromProperTimezone(): RubyTime {`
- `timestamp.ts:231` `@noRailsEquivalent` — `export const InstanceMethods = {`
- `token-for.ts:84` `@missingRailsArgs` — `export function generateTokenFor(this: Base, purpose: string): string`
- `touch-later.ts:107` `@noRailsEquivalent` — `export const InstanceMethods = {`
- `transactions.ts:228` `@missingRailsArgs` — `export function rememberTransactionRecordState(this: Base): void {`
- `transactions.ts:429` `@missingRailsCall` — `export function setOptionsForCallbacksBang(`
- `translation.ts:20` `@noRailsEquivalent` — `export const ClassMethods = {`
- `validations.ts:123` `@noRailsEquivalent` — `export function readAttributeForValidation(this: ValidationsHost, attr`
- `validations.ts:166` `@noRailsEquivalent` — `export const ClassMethods = {`

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
