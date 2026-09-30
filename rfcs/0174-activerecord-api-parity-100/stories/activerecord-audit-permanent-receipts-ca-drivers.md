---
title: "activerecord: audit the 49 PERMANENT receipts in connection-adapters/{postgresql,mysql,sqlite3}/ and sqlite/"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 49 of them:

- `connection-adapters/mysql/database-statements.ts:76` `@missingRailsCall` — `export async function returningColumnValues(`
- `connection-adapters/mysql/schema-statements.ts:62` `@missingRailsCall` — `async indexes(tableName: string): Promise<IndexDefinition[]> {`
- `connection-adapters/mysql/temporal-type-cast.ts:11` `@noRailsEquivalent` — `export function temporalTypeCast(field: Field, next: NextFn): unknown`
- `connection-adapters/postgresql/database-statements.ts:453` `@missingRailsCall` — `export function returningColumnValues(result: Result): unknown[] | und`
- `connection-adapters/postgresql/explain-pretty-printer.ts:4` `@missingRailsCall` — `pp(result: Result): string {`
- `connection-adapters/postgresql/pg-result.ts:4` `@noRailsEquivalent` — `export class PGResult extends Array<Record<string, unknown>> {`
- `connection-adapters/postgresql/pg-result.ts:6` `@noRailsEquivalent` — `static get [Symbol.species]() {`
- `connection-adapters/postgresql/pg-result.ts:13` `@noRailsEquivalent` — `constructor(native: pg.QueryResult) {`
- `connection-adapters/postgresql/pg-result.ts:24` `@noRailsEquivalent` — `get fields(): string[] {`
- `connection-adapters/postgresql/pg-result.ts:29` `@noRailsEquivalent` — `override values(): unknown[][] & ArrayIterator<Record<string, unknown>`
- `connection-adapters/postgresql/pg-result.ts:34` `@noRailsEquivalent` — `ntuples(): number {`
- `connection-adapters/postgresql/pg-result.ts:39` `@noRailsEquivalent` — `getvalue(tupNum: number, fieldNum: number): unknown {`
- `connection-adapters/postgresql/pg-result.ts:44` `@noRailsEquivalent` — `ftype(columnNumber: number): number {`
- `connection-adapters/postgresql/pg-result.ts:49` `@noRailsEquivalent` — `fmod(columnNumber: number): number {`
- `connection-adapters/postgresql/pg-result.ts:54` `@noRailsEquivalent` — `cmdTuples(): number {`
- `connection-adapters/postgresql/pg-result.ts:59` `@noRailsEquivalent` — `clear(): null {`
- `connection-adapters/postgresql/schema-definitions.ts:112` `@missingRailsCall` — `exportNameOnSchemaDump(): boolean {`
- `connection-adapters/postgresql/schema-dumper.ts:144` `@missingRailsCall` — `protected override async exclusionConstraintsInCreate(`
- `connection-adapters/postgresql/schema-dumper.ts:169` `@missingRailsCall` — `protected override async uniqueConstraintsInCreate(`
- `connection-adapters/postgresql/schema-statements.ts:117` `@missingRailsCall` — `async indexes(tableName: string): Promise<IndexDefinition[]> {`
- `connection-adapters/postgresql/schema-statements.ts:118` `@missingRailsName` — `async indexes(tableName: string): Promise<IndexDefinition[]> {`
- `connection-adapters/postgresql/schema-statements.ts:586` `@missingRailsName` — `override async buildChangeColumnDefaultDefinition(`
- `connection-adapters/postgresql/schema-statements.ts:709` `@missingRailsCall` — `override async foreignKeys(tableName: string): Promise<ForeignKeyDefin`
- `connection-adapters/postgresql/schema-statements.ts:956` `@missingRailsCall` — `async uniqueConstraints(tableName: string): Promise<UniqueConstraintDe`
- `connection-adapters/postgresql/temporal-type-parsers.ts:48` `@noRailsEquivalent` — `export function makeGetTypeParser(pgTypes: {`
- `connection-adapters/postgresql/oid/array.ts:21` `@noRailsEquivalent` — `export class PgTextEncoderArray {`
- `connection-adapters/postgresql/oid/array.ts:23` `@noRailsEquivalent` — `readonly name: string;`
- `connection-adapters/postgresql/oid/array.ts:32` `@noRailsEquivalent` — `encode(values: readonly unknown[]): string {`
- `connection-adapters/postgresql/oid/array.ts:43` `@noRailsEquivalent` — `export class PgTextDecoderArray {`
- `connection-adapters/postgresql/oid/array.ts:45` `@noRailsEquivalent` — `readonly name: string;`
- `connection-adapters/postgresql/oid/array.ts:54` `@noRailsEquivalent` — `decode(str: string): unknown[] {`
- `connection-adapters/postgresql/oid/point.ts:15` `@noRailsEquivalent` — `equals(other: unknown): boolean {`
- `connection-adapters/postgresql/oid/point.ts:90` `@missingRailsName` — `private buildPoint(x: unknown, y: unknown): InstanceType<typeof Active`
- `connection-adapters/postgresql/oid/range.ts:80` `@missingRailsCall` — `private extractBounds(value: string): {`
- `connection-adapters/sqlite3/database-statements.ts:275` `@missingRailsCall` — `export function returningColumnValues(result: Result): unknown[] | und`
- `connection-adapters/sqlite3/database-statements.ts:283` `@missingRailsCall` — `export function defaultInsertValue(column: {`
- `connection-adapters/sqlite3/schema-statements.ts:246` `@missingRailsCall` — `export async function virtualTableExists(`
- `connection-adapters/sqlite3/schema-statements.ts:287` `@missingRailsArgs` — `export function newColumnFromField(`
- `connection-adapters/sqlite3/schema-statements.ts:288` `@missingRailsArgs` — `export function newColumnFromField(`
- `sqlite/better-sqlite3.ts:1` `@noRailsEquivalent` — `import Database from "better-sqlite3";`
- `sqlite/errors.ts:131` `@noRailsEquivalent` — `export function status2klass(status: number): typeof Exception | null`
- `sqlite/errors.ts:193` `@noRailsEquivalent` — `function nativeStatus(error: unknown): number | null {`
- `sqlite/errors.ts:204` `@noRailsEquivalent` — `export function rbSqlite3Raise(error: unknown): never {`
- `sqlite/errors.ts:217` `@noRailsEquivalent` — `export function rbSqlite3RaiseWithSql(error: unknown, sql: string | nu`
- `sqlite/expo-sqlite.ts:1` `@noRailsEquivalent` — `import { createRequire } from "node:module";`
- `sqlite/libsql.ts:1` `@noRailsEquivalent` — `import Database from "libsql";`
- `sqlite/node-sqlite.ts:1` `@noRailsEquivalent` — `import { createRequire } from "node:module";`
- `sqlite/sqlite-uri.ts:3` `@noRailsEquivalent` — `export function isRemoteLibsqlUrl(url: string): boolean {`
- `sqlite/sqlite-uri.ts:17` `@noRailsEquivalent` — `export function isInMemoryDatabase(database: string): boolean {`

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
