---
title: "activerecord: audit the 55 PERMANENT receipts in connection-adapters/*.ts"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 55 of them:

- `connection-adapters/abandon-raw-socket.ts:12` `@noRailsEquivalent` — `export function abandonRawSocket(rawConnection: unknown): void {`
- `connection-adapters/abstract-adapter.ts:781` `@missingRailsCall` — `constructor(`
- `connection-adapters/abstract-adapter.ts:1218` `@noRailsEquivalent` — `[Symbol.for("nodejs.util.inspect.custom")](): string {`
- `connection-adapters/abstract-adapter.ts:1275` `@missingRailsName` — `unpreparedStatement<T>(fn: () => Promise<T> | T): Promise<T> | T {`
- `connection-adapters/abstract-adapter.ts:1770` `@missingRailsCall` — `static buildReadQueryRegexp(...parts: string[]): RegExp {`
- `connection-adapters/abstract-adapter.ts:1780` `@missingRailsCall` — `static findCmdAndExec(commands: string | string[], ...args: string[]):`
- `connection-adapters/abstract-adapter.ts:1781` `@missingRailsCall` — `static findCmdAndExec(commands: string | string[], ...args: string[]):`
- `connection-adapters/abstract-adapter.ts:1871` `@missingRailsName` — `static registerClassWithLimit(`
- `connection-adapters/abstract-adapter.ts:1885` `@missingRailsName` — `static registerClassWithPrecision(`
- `connection-adapters/abstract-adapter.ts:2024` `@missingRailsCall` — `backoff(counter: number): Promise<void> {`
- `connection-adapters/abstract-adapter.ts:2054` `@missingRailsCall` — `get typeMap(): unknown {`
- `connection-adapters/abstract-mysql-adapter.ts:880` `@missingRailsName` — `isStrictMode(): boolean | unknown {`
- `connection-adapters/abstract-mysql-adapter.ts:891` `@missingRailsCall` — `override async buildInsertSql(insert: InsertBuilder): Promise<string>`
- `connection-adapters/abstract-mysql-adapter.ts:975` `@missingRailsCall` — `static dbconsole(config: DatabaseConfig, options: Record<string, unkno`
- `connection-adapters/better-sqlite3-adapter.ts:1` `@noRailsEquivalent` — `import type { SqliteDriver } from "../sqlite-adapter.js";`
- `connection-adapters/expo-sqlite-adapter.ts:1` `@noRailsEquivalent` — `import type { SqliteDriver } from "../sqlite-adapter.js";`
- `connection-adapters/libsql-adapter.ts:1` `@noRailsEquivalent` — `import type { SqliteDriver } from "../sqlite-adapter.js";`
- `connection-adapters/libsql-remote-adapter.ts:1` `@noRailsEquivalent` — `import type { SqliteDriver } from "../sqlite-adapter.js";`
- `connection-adapters/libsql-remote-adapter.ts:17` `@noRailsEquivalent` — `override supportsConcurrentConnections(): boolean {`
- `connection-adapters/libsql-replica-adapter.ts:1` `@noRailsEquivalent` — `import type { SqliteDriver } from "../sqlite-adapter.js";`
- `connection-adapters/mysql2-adapter.ts:164` `@missingRailsCall` — `constructor(`
- `connection-adapters/node-sqlite-adapter.ts:1` `@noRailsEquivalent` — `import type { SqliteDriver } from "../sqlite-adapter.js";`
- `connection-adapters/pool-config.ts:136` `@missingRailsCall` — `static async discardPoolsBang(): Promise<void> {`
- `connection-adapters/pool-config.ts:148` `@missingRailsCall` — `static async disconnectAllBang(): Promise<void> {`
- `connection-adapters/pool-manager.ts:16` `@missingRailsName` — `get shardNames(): string[] {`
- `connection-adapters/pool-manager.ts:25` `@missingRailsName` — `get roleNames(): string[] {`
- `connection-adapters/pool-manager.ts:69` `@missingRailsCall` — `removeRole(role: string): Record<string, PoolConfig> | undefined {`
- `connection-adapters/pool-manager.ts:77` `@missingRailsCall` — `removePoolConfig(role: string, shard: string): PoolConfig | undefined`
- `connection-adapters/postgresql-adapter.ts:1462` `@missingRailsCall` — `async enableExtension(name: string, _options?: Record<string, unknown>`
- `connection-adapters/postgresql-adapter.ts:1472` `@missingRailsCall` — `async disableExtension(name: string, options: { force?: "cascade" } =`
- `connection-adapters/postgresql-adapter.ts:1619` `@missingRailsCall` — `async foreignTableExists(tableName: string): Promise<boolean> {`
- `connection-adapters/postgresql-adapter.ts:1975` `@missingRailsArgs` — `extractDefaultFunction(defaultValue: unknown, defaultExpr: string | nu`
- `connection-adapters/schema-cache.ts:82` `@missingRailsCall` — `static async _loadFrom(filename: string): Promise<SchemaCache | null>`
- `connection-adapters/schema-cache.ts:230` `@noRailsEquivalent` — `getCachedColumnsHash(tableName: string): Record<string, Column> | unde`
- `connection-adapters/schema-cache.ts:238` `@noRailsEquivalent` — `getCachedDataSourceExists(name: string): boolean | undefined {`
- `connection-adapters/schema-cache.ts:246` `@noRailsEquivalent` — `getCachedPrimaryKeys(tableName: string): string | string[] | null | un`
- `connection-adapters/schema-cache.ts:293` `@noRailsEquivalent` — `setColumns(tableName: string, cols: Column[]): void {`
- `connection-adapters/schema-cache.ts:359` `@missingRailsName` — `private deriveColumnsHashAndDeduplicateValues(): void {`
- `connection-adapters/schema-cache.ts:360` `@missingRailsName` — `private deriveColumnsHashAndDeduplicateValues(): void {`
- `connection-adapters/schema-cache.ts:361` `@missingRailsName` — `private deriveColumnsHashAndDeduplicateValues(): void {`
- `connection-adapters/schema-cache.ts:362` `@missingRailsName` — `private deriveColumnsHashAndDeduplicateValues(): void {`
- `connection-adapters/schema-cache.ts:390` `@missingRailsArgs` — `private async open(`
- `connection-adapters/schema-cache.ts:416` `@noRailsEquivalent` — `static eagerLoadSchemaCache = false;`
- `connection-adapters/schema-cache.ts:444` `@noRailsEquivalent` — `async loadAllBang(pool: Pool): Promise<this> {`
- `connection-adapters/schema-cache.ts:454` `@noRailsEquivalent` — `get loadedCache(): SchemaCache | null {`
- `connection-adapters/schema-cache.ts:462` `@noRailsEquivalent` — `set loadedCache(cache: SchemaCache | null) {`
- `connection-adapters/schema-cache.ts:548` `@missingRailsName` — `private possibleCacheAvailable(): boolean {`
- `connection-adapters/schema-cache.ts:619` `@noRailsEquivalent` — `async loadAllBang(): Promise<this> {`
- `connection-adapters/sqlite3-adapter.ts:237` `@missingRailsName` — `constructor(config: SQLite3Config) {`
- `connection-adapters/sqlite3-adapter.ts:569` `@missingRailsName` — `isSharedCache(): boolean {`
- `connection-adapters/sqlite3-adapter.ts:1109` `@missingRailsCall` — `private async tableStructureSql(tableName: string, columnNames?: strin`
- `connection-adapters/sqlite3-adapter.ts:1110` `@missingRailsCall` — `private async tableStructureSql(tableName: string, columnNames?: strin`
- `connection-adapters/sqlite3-adapter.ts:1378` `@missingRailsName` — `private connect(): void | Promise<void> {`
- `connection-adapters/statement-pool.ts:23` `@missingRailsCall` — `set(key: string, stmt: T): void | Promise<void> {`
- `connection-adapters/statement-pool.ts:24` `@missingRailsName` — `set(key: string, stmt: T): void | Promise<void> {`

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
