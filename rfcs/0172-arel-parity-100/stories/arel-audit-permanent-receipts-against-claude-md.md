---
title: "arel: audit the 15 PERMANENT receipts — each cites a ratified CLAUDE.md section or converges"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: receipts
packages: ["arel"]
deps: ["parity-100-rehome-postponed-rfc-dependencies", "arel-node-dup-missing"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

100% parity leaves only receipts ratified in CLAUDE.md. arel carries **15** `PERMANENT`
receipts (13 `@noRailsEquivalent`,
2 `@missingRailsArgs`). A PERMANENT token carries no
prose, so nothing today records which ratified section each one rests on:

- `packages/arel/src/clone-support.ts:1` `@noRailsEquivalent` on `export function objectClone<T extends object>(self: T): T {`
- `packages/arel/src/crud.ts:38` `@missingRailsArgs` on `compileUpdate(`
- `packages/arel/src/crud.ts:59` `@missingRailsArgs` on `compileDelete(`
- `packages/arel/src/math.ts:17` `@noRailsEquivalent` on `export interface MathModule {`
- `packages/arel/src/predications.ts:122` `@noRailsEquivalent` on `export interface PredicationsModule extends GroupingFolders {`
- `packages/arel/src/table.ts:21` `@noRailsEquivalent` on `export interface TypeCaster {`
- `packages/arel/src/temporal-tag.ts:1` `@noRailsEquivalent` on `export function temporalTag(v: unknown): string | null {`
- `packages/arel/src/attributes/attribute.ts:49` `@noRailsEquivalent` on `hash(): number {`
- `packages/arel/src/nodes/sql-literal.ts:22` `@noRailsEquivalent` on `eql(other: unknown): boolean {`
- `packages/arel/src/nodes/sql-literal.ts:28` `@noRailsEquivalent` on `hash(): number {`
- `packages/arel/src/nodes/sql-literal.ts:41` `@noRailsEquivalent` on `isBlank(): boolean {`
- `packages/arel/src/visitors/connection.ts:1` `@noRailsEquivalent` on `export interface ArelConnection {`
- `packages/arel/src/visitors/ruby-class.ts:1` `@noRailsEquivalent` on `import { temporalClassName, temporalTag } from "../temporal-tag.js";`
- `packages/arel/src/visitors/ruby-class.ts:6` `@noRailsEquivalent` on `export function setRubyNamespace(ctor: object, nesting: string): void {`
- `packages/arel/src/visitors/ruby-class.ts:11` `@noRailsEquivalent` on `export function rubyConstantName(ctor: object): string | null {`

The ratified sections that can back an arel receipt are § "Call-time constant resolution"
(`arel/src/namespaces.ts`), § "Override arity", and § "Module mixins". A receipt that none of them
covers is a deviation to converge; `clone-support.ts` in particular is also flagged by
`pnpm parity:structural-duplicates:report` (`dup` → `objectClone`), which argues for the ruby-compat
`dup` from `arel-node-dup-missing`.

## Acceptance criteria

- [ ] The PR body tables every receipt above against the CLAUDE.md section that ratifies it.
- [ ] Every receipt with no ratifying section is converged (the declaration removed or the call restored), or — if the convergence exceeds this story — split into its own story in this RFC with `pnpm tasks new 0172-arel-parity-100 <slug> --body-file …` and re-tagged `CONVERGEABLE <slug>` in the same PR.
- [ ] `pnpm parity:api:extra:gate`, `pnpm parity:api:calls:args` and `pnpm parity:api:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
