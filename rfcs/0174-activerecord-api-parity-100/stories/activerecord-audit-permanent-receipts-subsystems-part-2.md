---
title: "activerecord: audit the 33 PERMANENT receipts in encryption/, database-configurations/, tasks/, type*/, migration/, and the other subdirectories (part 2)"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 33 of them:

- `middleware/database-selector/resolver/session.ts:28` `@missingRailsName` — `updateLastWriteTimestamp(): number {`
- `migration/command-recorder.ts:96` `@missingRailsName` — `async changeTable(`
- `migration/command-recorder.ts:150` `@missingRailsCall` — `invertCreateTable(args: unknown[], block?: MigrationBlock): MigrationC`
- `migration/command-recorder.ts:305` `@missingRailsCall` — `invertAddForeignKey(args: unknown[], block?: MigrationBlock): Migratio`
- `migration/command-recorder.ts:452` `@missingRailsName` — `async invertTransaction(args: unknown[], block?: MigrationBlock): Prom`
- `migration/compatibility.ts:218` `@missingRailsArgs` — `override compatibleTableDefinition<T>(t: T): T {`
- `migration/compatibility.ts:404` `@missingRailsArgs` — `override async commandRecorder(): Promise<MigrationCommandRecorder> {`
- `scoping/default.ts:84` `@noRailsEquivalent` — `export function hasDefaultScopeOverride(modelClass: any): boolean {`
- `scoping/default.ts:135` `@missingRailsCall` — `export function isScopeAttributes(this: {`
- `tasks/database-tasks.ts:32` `@noRailsEquivalent` — `constructor(message: string) {`
- `tasks/database-tasks.ts:67` `@missingRailsCall` — `static get dbDir(): string {`
- `tasks/database-tasks.ts:357` `@missingRailsCall` — `static targetVersion(): number | null {`
- `tasks/database-tasks.ts:576` `@missingRailsCall` — `static async loadSchema(`
- `tasks/mysql-database-tasks.ts:91` `@missingRailsCall` — `private creationOptions(): { charset?: string; collation?: string } {`
- `tasks/mysql-database-tasks.ts:160` `@missingRailsCall` — `private configurationHashWithoutDatabase(): ConfigHash {`
- `tasks/postgresql-database-tasks.ts:39` `@missingRailsCall` — `async create(connectionAlreadyEstablished = false): Promise<void> {`
- `tasks/postgresql-database-tasks.ts:204` `@missingRailsCall` — `private publicSchemaConfig(): ConfigHash {`
- `type-virtualization/auto-import.ts:1` `@noRailsEquivalent` — `import * as ts from "typescript/unstable/ast";`
- `type-virtualization/index.ts:1` `@noRailsEquivalent` — `export { virtualize, remapLine } from "./virtualize.js";`
- `type-virtualization/resolve-target.ts:1` `@noRailsEquivalent` — `import { classify, singularize } from "@blazetrails/activesupport";`
- `type-virtualization/synthesize.ts:1` `@noRailsEquivalent` — `import * as ts from "typescript/unstable/ast";`
- `type-virtualization/transitive-extends-walker.ts:1` `@noRailsEquivalent` — `import * as ts from "typescript/unstable/ast";`
- `type-virtualization/ts-api.ts:1` `@noRailsEquivalent` — `import { API } from "typescript/unstable/sync";`
- `type-virtualization/type-registry.ts:1` `@noRailsEquivalent` — `const T = 'import("@blazetrails/date").Temporal';`
- `type-virtualization/virtualize.ts:1` `@noRailsEquivalent` — `import * as ts from "typescript/unstable/ast";`
- `type-virtualization/walker.ts:1` `@noRailsEquivalent` — `import * as ts from "typescript/unstable/ast";`
- `type-virtualization/walker.ts:369` `@noRailsEquivalent` — `export function findIncludeCalls(sourceFile: ts.SourceFile): IncludeCa`
- `type/hash-lookup-type-map.ts:120` `@missingRailsCall` — `private performFetch(`
- `type/hash-lookup-type-map.ts:121` `@missingRailsCall` — `private performFetch(`
- `type/type-map.ts:45` `@missingRailsCall` — `protected performFetch(`
- `validations/associated.ts:16` `@missingRailsCall` — `async validateEach(record: any, attribute: string, value: unknown): Pr`
- `validations/associated.ts:17` `@missingRailsCall` — `async validateEach(record: any, attribute: string, value: unknown): Pr`
- `validations/associated.ts:18` `@missingRailsCall` — `async validateEach(record: any, attribute: string, value: unknown): Pr`

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
