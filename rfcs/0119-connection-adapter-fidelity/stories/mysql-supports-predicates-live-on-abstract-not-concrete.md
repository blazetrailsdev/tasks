---
title: "The five MySQL supports_*? predicates live on AbstractMysqlAdapter where Rails puts them on Mysql2Adapter"
status: draft
updated: 2026-08-29
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Move the five MySQL `supports_*?` predicates onto `Mysql2Adapter`

## Context

Rails defines these five capability predicates on the CONCRETE adapter, not on
`AbstractMysqlAdapter`:

- `supports_json?` — `activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:70-72`
- `supports_comments?` — `mysql2_adapter.rb:74-76`
- `supports_comments_in_create?` — `mysql2_adapter.rb:78-80`
- `supports_savepoints?` — `mysql2_adapter.rb:82-84`
- `supports_lazy_transactions?` — `mysql2_adapter.rb:90-92`

(`trilogy_adapter.rb` carries its own copies; trails does not port Trilogy.)

trails puts all five on `AbstractMysqlAdapter`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`), so
`pnpm parity:api:extra --package activerecord` scores each as `moved` on
`abstract-mysql-adapter.ts` rather than matched on `mysql2-adapter.ts`. After
PR #7204 that file reports `0 novel, 9 moved`; these five are the bulk of the 9.

This is the same deviation class as `text-type-predicate-lives-on-abstract-mysql-not-concrete`,
converged in PR #7204 — read that diff first, it establishes the whole shape.

## Converged shape

Move each body to `Mysql2Adapter` (`mysql2-adapter.ts`) unchanged.

Where a body on `AbstractMysqlAdapter` still calls one of them through `this`,
TypeScript needs the member visible on the calling class, which Ruby does not —
`abstract_mysql_adapter.rb` reaches concrete predicates through `self` and
resolves at call time. PR #7204 settled that seam:

- declare it on the declaration-merged `export interface AbstractMysqlAdapter`
  (already present in the file), tagged `@internal` +
  `@noRailsEquivalent PERMANENT`;
- give the interface member a `drift-ok:` leading comment, or
  `scripts/mixin-declaration-drift.test.ts`'s "every declared method is
  installed on the adapter" arm reds — it requires each declared name to exist
  on `AbstractMysqlAdapter.prototype`, and `requiredInterfaceMethodNames`
  (`scripts/mixin-declaration-drift.ts:178`) exempts exactly `drift-ok:` and
  optional members.

Also check test doubles: `abstract-mysql-adapter.trails.test.ts` builds stubs
with `Object.create(<Adapter>.prototype)`, and any stub reaching a moved
predicate must be built on `Mysql2Adapter.prototype`. Those arms are
`describeIfMysqlAdapter`-gated, so they skip on SQLite and only red the
MySQL/MariaDB lanes — do not read a green local run as coverage.

## Acceptance criteria

- [ ] All five predicates live in `mysql2-adapter.ts`, matching
      `mysql2_adapter.rb:70-92`.
- [ ] `abstract-mysql-adapter.ts`'s `moved` count drops by five;
      `pnpm parity:api:extra --package activerecord` novel/total do not grow.
- [ ] `pnpm vitest run scripts/mixin-declaration-drift.test.ts` green.
- [ ] MySQL and MariaDB lanes green (`ARCONN=mysql2`).

## Provenance

Surfaced while converging `text-type-predicate-lives-on-abstract-mysql-not-concrete` (PR #7204).
