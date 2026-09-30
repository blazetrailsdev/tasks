---
title: "activerecord: audit the 45 PERMANENT receipts in top-level src files a–m"
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
that the cheap path to `novel: 0` was tagging rather than deleting. This story audits 45 of them:

- `association-relation.ts:30` `@noRailsEquivalent` — `override clone(): Relation<T> {`
- `associations.ts:146` `@noRailsEquivalent` — `export function registerModelConstant(name: string, model: typeof Base`
- `associations.ts:153` `@noRailsEquivalent` — `export function registerModel(model: typeof Base): void;`
- `associations.ts:200` `@noRailsEquivalent` — `export function autoloadModel(name: string): void {`
- `asynchronous-queries-tracker.ts:42` `@missingRailsCall` — `get currentSession(): Session {`
- `attribute-methods.ts:187` `@missingRailsCall` — `export function dangerousAttributeMethods(): Set<string> {`
- `attribute-methods.ts:231` `@missingRailsName` — `export function initializeGeneratedModules(this: AttributeMethodsHost)`
- `attribute-methods.ts:637` `@missingRailsCall` — `isAttributeMethod(this: { columnNames(): string[] } & object, attribut`
- `attribute-methods.ts:645` `@missingRailsCall` — `attributeNames: classAttributeNames,`
- `attributes.ts:48` `@noRailsEquivalent` — `export function isReplayingOverColdSchema(): boolean {`
- `autosave-association.ts:546` `@missingRailsCall` — `export function defineNonCyclicMethod(this: any, name: string, fn: (th`
- `base.ts:980` `@noRailsEquivalent` — `declare static readonly subclasses: (typeof Base)[];`
- `base.ts:1660` `@noRailsEquivalent` — `static allocate<T extends typeof Base>(this: T): InstanceType<T> {`
- `connection-handling.ts:487` `@missingRailsCall` — `export const DEFAULT_ENV = (): string => RAILS_ENV() || "default_env";`
- `core.ts:92` `@missingRailsCall` — `inspect(`
- `core.ts:207` `@missingRailsName` — `export function isFrozen(this: FrozenRecord): boolean {`
- `core.ts:350` `@missingRailsName` — `export function encodeWith(`
- `core.ts:443` `@missingRailsCall` — `export function connectedToStack(): ConnectedToEntry[] {`
- `core.ts:499` `@missingRailsCall` — `export function isPreventingWrites(className?: string): boolean {`
- `core.ts:739` `@noRailsEquivalent` — `export function clone<T extends CloneRecord>(this: T): T {`
- `database-configurations.ts:161` `@missingRailsCall` — `private defaultEnv(): string {`
- `database-configurations.ts:167` `@missingRailsName` — `private buildConfigs(configs: RawConfigurations | HashConfig[]): HashC`
- `disable-joins-association-relation.ts:174` `@noRailsEquivalent` — `override clone(): Relation<T> {`
- `disable-joins-association-relation.ts:241` `@missingRailsCall` — `override limit(value: number | null): Relation<T> | Promise<T[]> {`
- `disable-joins-association-relation.ts:254` `@missingRailsCall` — `override async first(limit?: number): Promise<T | T[] | null> {`
- `enum.ts:188` `@missingRailsCall` — `export function _enum(`
- `gem-version.ts:13` `@missingRailsCall` — `export function gemVersion(): string {`
- `index.ts:1` `@noRailsEquivalent` — `export { Base } from "./base.js";`
- `inheritance.ts:104` `@noRailsEquivalent` — `export function qualifiedName(modelClass: typeof Base): string {`
- `inheritance.ts:114` `@noRailsEquivalent` — `export function namespaceSegments(modelClass: typeof Base): string[] {`
- `inheritance.ts:137` `@noRailsEquivalent` — `export function registerSubclass(klass: typeof Base): void {`
- `integration.ts:124` `@missingRailsCall` — `toParam(this: { name: string; prototype: any }, methodName?: string):`
- `log-subscriber.ts:61` `@missingRailsCall` — `sql(event: Event): void {`
- `migration.ts:242` `@noRailsEquivalent` — `[toRun]: Array<() => Promise<void>> = [];`
- `migration.ts:1037` `@missingRailsCall` — `static async copy(`
- `migration.ts:1252` `@missingRailsCall` — `static env(): string {`
- `migration.ts:1357` `@missingRailsCall` — `async loadMigration(): Promise<Migration> {`
- `migration.ts:1514` `@missingRailsCall` — `get currentEnvironment(): string {`
- `migration.ts:1557` `@missingRailsCall` — `async needsMigration(this: MigrationContext): Promise<boolean> {`
- `migration.ts:1790` `@missingRailsName` — `async executeMigrationInTransaction(`
- `migration.ts:2074` `@missingRailsCall` — `private buildWatcher(block: () => Promise<void> | void): FileUpdateChe`
- `model-schema.ts:284` `@missingRailsArgs` — `export function fullTableNamePrefix(this: SchemaHost): string {`
- `model-schema.ts:293` `@missingRailsArgs` — `export function fullTableNameSuffix(this: SchemaHost): string {`
- `model-schema.ts:359` `@missingRailsName` — `export function columns(this: SchemaHost): any[] {`
- `model-schema.ts:784` `@noRailsEquivalent` — `export const InstanceMethods = {`

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
