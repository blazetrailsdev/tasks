---
title: "activerecord: audit the 39 PERMANENT receipts in connection-adapters/abstract/"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 39 of them:

- `connection-adapters/abstract/connection-handler.ts:37` `@missingRailsName` — `currentPreventingWrites(): boolean {`
- `connection-adapters/abstract/connection-handler.ts:59` `@missingRailsArgs` — `constructor() {`
- `connection-adapters/abstract/connection-handler.ts:91` `@missingRailsCall` — `connectionPoolList(role?: string | null): ConnectionPool[] {`
- `connection-adapters/abstract/connection-pool.ts:169` `@missingRailsCall` — `set(key: Thread | Fiber, value: V): void {`
- `connection-adapters/abstract/connection-pool.ts:295` `@noRailsEquivalent` — `[Symbol.for("nodejs.util.inspect.custom")](): string {`
- `connection-adapters/abstract/connection-pool.ts:593` `@missingRailsCall` — `stat(): {`
- `connection-adapters/abstract/database-statements.ts:352` `@missingRailsName` — `export async function truncate(`
- `connection-adapters/abstract/database-statements.ts:543` `@missingRailsName` — `export function addTransactionRecord(`
- `connection-adapters/abstract/schema-creation.ts:91` `@missingRailsCall` — `async accept(o: object): Promise<string> {`
- `connection-adapters/abstract/schema-creation.ts:175` `@missingRailsCall` — `protected async visitAlterTable(o: AlterTable): Promise<string> {`
- `connection-adapters/abstract/schema-creation.ts:338` `@missingRailsCall` — `protected columnOptions(o: ColumnDefinition): Record<string, unknown>`
- `connection-adapters/abstract/schema-definitions.ts:180` `@missingRailsCall` — `get isExportNameOnSchemaDump(): boolean {`
- `connection-adapters/abstract/schema-definitions.ts:603` `@missingRailsCall` — `private conditionalOptions(): Pick<ColumnOptions, "ifExists" | "ifNotE`
- `connection-adapters/abstract/schema-definitions.ts:614` `@missingRailsCall` — `private polymorphicOptions(): ColumnOptions {`
- `connection-adapters/abstract/schema-definitions.ts:615` `@missingRailsCall` — `private polymorphicOptions(): ColumnOptions {`
- `connection-adapters/abstract/schema-definitions.ts:634` `@missingRailsCall` — `protected indexOptions(tableName: string): AddIndexOptions {`
- `connection-adapters/abstract/schema-definitions.ts:652` `@missingRailsCall` — `private foreignKeyOptions(): ReferenceForeignKeyOptions {`
- `connection-adapters/abstract/schema-definitions.ts:674` `@missingRailsArgs` — `private foreignTableName(): string {`
- `connection-adapters/abstract/schema-definitions.ts:1192` `@missingRailsName` — `async changeNull(columnName: string, isNull: boolean, defaultValue?: u`
- `connection-adapters/abstract/schema-definitions.ts:1193` `@missingRailsName` — `async changeNull(columnName: string, isNull: boolean, defaultValue?: u`
- `connection-adapters/abstract/schema-statements.ts:1081` `@missingRailsCall` — `foreignKeyOptions(`
- `connection-adapters/abstract/schema-statements.ts:1392` `@missingRailsCall` — `generateIndexName(tableName: string, column: string | string[]): strin`
- `connection-adapters/abstract/schema-statements.ts:1629` `@missingRailsCall` — `foreignKeyName(`
- `connection-adapters/abstract/schema-statements.ts:1686` `@missingRailsArgs` — `isForeignKeysEnabled(): boolean {`
- `connection-adapters/abstract/schema-statements.ts:1695` `@missingRailsCall` — `checkConstraintName(`
- `connection-adapters/abstract/schema-statements.ts:1784` `@missingRailsCall` — `canRemoveIndexByName(`
- `connection-adapters/abstract/sql-datetime.ts:3` `@noRailsEquivalent` — `import { Temporal, cCivilToJd, strftime, type StrftimeSubject } from "`
- `connection-adapters/abstract/temporal-wire.ts:1` `@noRailsEquivalent` — `import { Temporal } from "@blazetrails/date";`
- `connection-adapters/abstract/transaction.ts:495` `@missingRailsName` — `async commitRecords(): Promise<void> {`
- `connection-adapters/abstract/transaction.ts:839` `@missingRailsCall` — `get currentTransaction(): Transaction | NullTransaction {`
- `connection-adapters/abstract/transaction.ts:846` `@missingRailsCall` — `get openTransactions(): number {`
- `connection-adapters/abstract/transaction.ts:852` `@missingRailsCall` — `async beginTransaction(`
- `connection-adapters/abstract/transaction.ts:853` `@missingRailsCall` — `async beginTransaction(`
- `connection-adapters/abstract/transaction.ts:967` `@missingRailsCall` — `async commitTransaction(): Promise<void> {`
- `connection-adapters/abstract/transaction.ts:991` `@missingRailsCall` — `async rollbackTransaction(transaction?: Transaction): Promise<void> {`
- `connection-adapters/abstract/connection-pool/queue.ts:100` `@missingRailsName` — `export function withABiasFor<T>(this: BiasableQueueHost, thread: unkno`
- `connection-adapters/abstract/connection-pool/queue.ts:101` `@missingRailsName` — `export function withABiasFor<T>(this: BiasableQueueHost, thread: unkno`
- `connection-adapters/abstract/connection-pool/queue.ts:200` `@missingRailsCall` — `private canRemoveNoWait(): boolean {`
- `connection-adapters/abstract/connection-pool/reaper.ts:34` `@missingRailsCall` — `static registerPool(pool: ReapablePool, frequency: number): void {`

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
