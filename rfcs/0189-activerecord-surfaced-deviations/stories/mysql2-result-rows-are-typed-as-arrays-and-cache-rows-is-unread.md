---
title: "activerecord: Mysql2 Result#to_a is typed as array rows only, and cache_rows is read by nothing"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 120
priority: 93
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `mysql2-client-query-honours-its-query-options` (trails#8785).

`packages/activerecord/src/mysql2/client.ts`:

- `Mysql2Result#toA()` and `Result`'s `rows` are typed `unknown[][]`. With the gem's default
  `as: :hash` (`vendor/mysql2/0.5.6/lib/mysql2/client.rb:7`) a row is a Hash keyed by field name
  (`ext/mysql2/result.c:732-736`, `rb_hash_new` unless `asArray`), and the port does return objects
  there, so the type is wrong for every non-`"array"` query. Widening it in trails#8785 broke about
  20 test call sites that index a row by position and was backed out.
- `cacheRows` is still in `defaultQueryOptions()` and read by nothing. `Result` always holds its
  rows, which is `cache_rows: true`; `cache_rows: false` (`result.c:1090-1093`) has no effect.

## Converged shape

`toA()` answers `Array<unknown[] | Record<string, unknown>>` (or is generic over the `as` option),
and the call sites that index by position narrow at the call. `cacheRows` is either honoured or
removed from `defaultQueryOptions()`, as `async` was.

## Acceptance criteria

- [ ] `Mysql2Result#toA()`'s type admits a hash row; no `as never` / `as unknown[][]` cast added in `src` to get there.
- [ ] `cacheRows` is honoured with a trails test, or deleted from `defaultQueryOptions()`.
- [ ] `pnpm typecheck` passes.

## Audit 2026-10-22

Still present: `toA(): unknown[][]` at `mysql2/client.ts:35` and
`cacheRows: true` at `:211`.
