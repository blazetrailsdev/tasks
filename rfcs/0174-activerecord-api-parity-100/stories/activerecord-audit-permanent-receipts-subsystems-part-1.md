---
title: "activerecord: audit the 34 PERMANENT receipts in encryption/, database-configurations/, tasks/, type*/, migration/, and the other subdirectories (part 1)"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 34 of them:

- `attribute-methods/primary-key.ts:80` `@missingRailsName` — `get idBeforeTypeCast(): unknown {`
- `attribute-methods/primary-key.ts:86` `@missingRailsName` — `get idWas(): unknown {`
- `attribute-methods/primary-key.ts:92` `@missingRailsName` — `get idInDatabase(): unknown {`
- `database-configurations/connection-url-resolver.ts:11` `@missingRailsCall` — `constructor(url: string) {`
- `database-configurations/connection-url-resolver.ts:122` `@missingRailsCall` — `private rawConfig(): Record<string, unknown> {`
- `database-configurations/connection-url-resolver.ts:148` `@missingRailsCall` — `private databaseFromPath(): string | undefined {`
- `database-configurations/database-config.ts:151` `@missingRailsCall` — `get forCurrentEnv(): boolean {`
- `database-configurations/hash-config.ts:42` `@missingRailsCall` — `override set _database(database: string) {`
- `database-configurations/url-config.ts:9` `@missingRailsCall` — `constructor(`
- `database-configurations/url-config.ts:10` `@missingRailsName` — `constructor(`
- `encryption/auto-filtered-parameters.ts:60` `@missingRailsCall` — `private collectForLater(klass: any, attribute: string): void {`
- `encryption/configurable.ts:90` `@missingRailsCall` — `static onEncryptedAttributeDeclared(callback: (klass: any, name: strin`
- `encryption/contexts.ts:64` `@missingRailsCall` — `static get currentCustomContext(): Context | null {`
- `encryption/encoding-helpers.ts:3` `@noRailsEquivalent` — `export function normalizeEncoding(encoding: string): "utf8" | "ascii"`
- `encryption/encoding-helpers.ts:24` `@noRailsEquivalent` — `export function headerString(value: unknown): string | undefined {`
- `encryption/encoding-helpers.ts:34` `@noRailsEquivalent` — `export function replaceUnencodable(value: string, maxCodePoint: number`
- `encryption/encrypted-attribute-type.ts:202` `@missingRailsCall` — `private serializeWithOldest(value: unknown): unknown {`
- `encryption/errors.ts:4` `@noRailsEquivalent` — `constructor(message?: string) {`
- `encryption/extended-deterministic-queries.ts:14` `@missingRailsArgs` — `static installSupport(targets: {`
- `encryption/extended-deterministic-queries.ts:196` `@noRailsEquivalent` — `readonly [ADDITIONAL_VALUE_BRAND] = true;`
- `encryption/extended-deterministic-queries.ts:209` `@noRailsEquivalent` — `toString(): string {`
- `encryption/extended-deterministic-queries.ts:214` `@noRailsEquivalent` — `valueOf(): unknown {`
- `encryption/extended-deterministic-queries.ts:219` `@noRailsEquivalent` — `[Symbol.toPrimitive](hint: string): string | number {`
- `encryption/extended-deterministic-uniqueness-validator.ts:8` `@missingRailsArgs` — `static installSupport({`
- `encryption/key-provider.ts:16` `@missingRailsCall` — `encryptionKey(): Key {`
- `encryption/key.ts:15` `@missingRailsCall` — `get id(): string {`
- `encryption/cipher/aes256-gcm.ts:39` `@noRailsEquivalent` — `[Symbol.for("nodejs.util.inspect.custom")](): string {`
- `fixture-set/file.ts:10` `@noRailsEquivalent` — `static registerModule(file: string, rows: Record<string, unknown>): vo`
- `fixture-set/file.ts:15` `@noRailsEquivalent` — `static modules(): string[] {`
- `fixture-set/table-row.ts:150` `@missingRailsName` — `private generatePrimaryKey(): void {`
- `fixture-set/table-row.ts:159` `@missingRailsName` — `private generateCompositePrimaryKey(): void {`
- `locking/optimistic.ts:258` `@noRailsEquivalent` — `export const InstanceMethods = {`
- `locking/pessimistic.ts:82` `@noRailsEquivalent` — `export const InstanceMethods = {`
- `middleware/database-selector/resolver/session.ts:19` `@missingRailsCall` — `static convertTimestampToTime(timestamp: number | undefined): Temporal`

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
