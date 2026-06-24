---
title: "converge-abstractadapter-superset-then-delete-barrel"
status: ready
updated: 2026-06-24
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Supersedes the deletion attempt under `pr-a-delete-adapter-barrel`. That story
assumed "AbstractAdapter is the superset per #2402" and that deleting
`packages/activerecord/src/adapter.ts` + the `DatabaseAdapter` interface was a
mechanical repoint of ~45 type-only sites. **That premise is false at the TS
type level.** Verified 2026-06-24: `main` typechecks at 0 errors
(`pnpm exec tsc -b packages/activerecord`); blindly repointing every
`import type { DatabaseAdapter }` to `AbstractAdapter as DatabaseAdapter` from
`connection-adapters/abstract-adapter.js` (and deleting `adapter.ts`) produces
**38 new type errors**. Root causes:

- `AbstractAdapter` does NOT declare `explain?`, `createTableDefinition?`,
  `schemaCreation?` on its base type — the `DatabaseAdapter` interface did (as
  optional members). Those live on subclasses/mixins
  (`abstract/schema-statements.ts:2187`, `postgresql/database-statements.ts:39`,
  etc.), not the base class. Call sites in `relation.ts:3284`,
  `migration.ts:1984/1991`, `abstract/schema-statements.ts:308` access them off
  a base-typed value and break.
- `adapterName`: the interface typed it `AdapterName`
  (`"postgres"|"mysql"|"sqlite"`); `AbstractAdapter` (abstract-adapter.ts:967)
  returns `string` and the base getter returns `"Abstract"` — NOT a valid
  `AdapterName`. Cannot be narrowed without a design decision. ~6 downstream
  TS2322/TS2345 sites (type.ts:122, insert-all.ts:157, migration.ts:255/1749,
  define-fixtures.ts:232, schema-statements.ts:207/1464) relied on the narrow
  type.
- TS classes can't declare optional methods (`explain?()`) on the
  implementation, so making `AbstractAdapter` literally absorb the optional-heavy
  interface is architecturally awkward — needs a design choice (optional
  property fields vs a separate structural type vs keeping the interface).
- Two interfaces `extends DatabaseAdapter` — `TransactionAwareConnection`
  (`connection-adapters/abstract/connection-pool.ts:38`) and
  `TransactionConnection` (`connection-adapters/abstract/transaction.ts:291`).
  Repointing them to `extends AbstractAdapter` (a class with 28
  private/protected members) yields TS2430 "incorrectly extends".
- The original grep missed inline dynamic type imports
  `import("../adapter.js")` in `tasks/database-tasks.ts` (8 sites) and
  `migrator.test.ts:1021` — these also need repointing.
- Cross-package public consumers of the `DatabaseAdapter` index export:
  `packages/trailties/src/{database,schema-source,commands/db}.ts` and
  `packages/activerecord/dx-tests/edge-cases.test-d.ts` (which asserts
  `DatabaseAdapter` is a structural superset of `Visitors.ArelConnection`).
  Deleting/aliasing the public export must keep these green.

## Acceptance criteria

- [ ] Decide and document the `adapterName` typing approach (narrow vs keep
      `string` + guard downstream) so the ~6 narrowing sites compile.
- [ ] Make `AbstractAdapter` a genuine type superset of the deleted interface's
      surface (explain/createTableDefinition/schemaCreation/etc.) OR introduce
      the agreed structural type, so all base-typed call sites compile.
- [ ] Resolve the two `extends DatabaseAdapter` interfaces.
- [ ] Repoint ALL sites incl. inline `import("../adapter.js")` in
      database-tasks.ts + migrator.test.ts; `grep -rnE "adapter(\.js)?['\"]"`
      and `grep -rn 'import(.*adapter\.js'` return zero non-self hits.
- [ ] `packages/activerecord/src/adapter.ts` + `DatabaseAdapter` interface
      deleted; `index.ts` forwards from real sources (keep a `DatabaseAdapter`
      public alias if trailties/dx-tests still need it, else update them).
- [ ] `pnpm exec tsc -b packages/activerecord` AND trailties typecheck both at
      0 errors.
- [ ] Likely exceeds 500 LOC — split into (a) make-AbstractAdapter-superset +
      adapterName decision, then (b) repoint + delete, as separate PRs from main.
