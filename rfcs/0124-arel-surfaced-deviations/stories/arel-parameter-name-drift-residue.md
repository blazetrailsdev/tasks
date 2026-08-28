---
title: "arel-parameter-name-drift-residue"
status: draft
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
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

`arel-parameter-name-drift-sweep` (PR #7123) fixed the 12 renames the first
arel audit listed. An automated same-arity diff of every matched Ruby `def`
against its TS method in the 2026-08-27 re-audit finds four that remain:

- `packages/arel/src/factory-methods.ts:80` `cast(expr, type)` vs
  `vendor/rails/activerecord/lib/arel/factory_methods.rb:49` `cast(name, type)`.
- `packages/arel/src/nodes/join-source.ts` constructor `(left, right)` vs
  `nodes/join_source.rb:9` `initialize(single_source, joinop = [])` — both
  positional parameters of a public constructor renamed.
- `packages/arel/src/nodes/count.ts` constructor `alias` vs `nodes/count.rb:7`
  `initialize(expr, distinct = false, aliaz = nil)` — `named-function.ts:9`
  already keeps `aliaz`.
- `packages/arel/src/nodes/sql-literal.ts:12` constructor `value` vs
  `nodes/sql_literal.rb:13` `initialize(string, retryable: false)` (the
  `retryable:` kwarg → `options` object is the settled idiom and is not in
  scope; only the first parameter's name is).

## Acceptance criteria

- The four parameters carry the Rails identifier, camelCased
  (`name`, `singleSource`/`joinop`, `aliaz`, `string`); any internal field
  they assign keeps its current name unless Rails' ivar differs.
- No behaviour change; `pnpm parity:api --package arel` 957/957, arity
  unchanged, `parity:api:calls:args` no new row.
- arel tests green; no test renamed.
