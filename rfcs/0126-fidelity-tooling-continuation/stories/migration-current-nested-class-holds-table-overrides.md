---
title: "migration-current-nested-class-holds-table-overrides"
status: draft
updated: 2026-08-30
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration::Current` (migration.rb:579-608) is a nested class —
`class Current < Migration` — and it is where Rails declares the four
compatibility-wrapping overrides: `create_table` (:580), `change_table` (:588),
`create_join_table` (:596) and `drop_table` (:604). Each calls `super` and wraps
the yielded table definition in `compatible_table_definition(t)`; `Migration`
itself declares none of them and reaches the connection through
`method_missing` (migration.rb:1006-1019).

trails declares all four directly on `class Migration`
(`packages/activerecord/src/migration.ts:368`, `:397`, `:782`, `:812`), with no
`Current` in the file at all, so the compatibility seam Rails puts between
`Migration` and the connection has nowhere to live —
`Migration::Compatibility::V*`'s overrides (migration/compatibility.ts) sit on a
chain that never passes through it.

Surfaced by the RFC 0126 nested-class allowance scoping (this PR): the extra
surface scorer used to admit a nested class's method names FILE-wide, so a
`create_table` on the outer TS class matched `Current`'s allowance. Scoped to
the declaration that ports the nested class, the four score as extra again and
carry `@noRailsEquivalent CONVERGEABLE <this story>` receipts at
migration.ts:368/397/782/812 until they converge.

## Acceptance criteria

- `migration.ts` declares `Current` extending `Migration`, holding
  `createTable` / `changeTable` / `createJoinTable` / `dropTable`, each
  delegating up and wrapping the yielded definition the way migration.rb:580-608
  does.
- The four `@noRailsEquivalent CONVERGEABLE` receipts on `Migration`'s copies
  are deleted, and `pnpm parity:api:extra:tighten` writes activerecord's mark
  DOWN.
- `pnpm parity:api --package activerecord` delta is non-negative.
