---
title: "Result: freeze columns, column_indexes and indexed_rows at build, as result.rb does"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Result` freezes three values at build time that trails leaves mutable. Surfaced while
porting `Result#freeze` in trails#8385, which only covers `hash_rows` / `indexed_rows` on an explicit
`freeze`.

- `initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/result.rb:103-111`):
  `@columns = columns.each(&:-@).freeze`. trails' constructor
  (`packages/activerecord/src/result.ts`, `constructor`) stores `columns` as given, unfrozen.
- `column_indexes` (`result.rb:203-214`): the memoized hash ends in `hash.freeze`. trails'
  `columnIndexes` getter returns a plain mutable object.
- `indexed_rows` (`result.rb:216-221`): `@rows.map { ... }.freeze`. trails' `indexedRows` getter
  returns a mutable array unless `Result#freeze` was called.

So a caller can push to `result.columns`, write into `result.columnIndexes`, or mutate
`result.indexedRows` where Rails raises `FrozenError`.

## Converged shape

- The constructor freezes the columns array it stores (`Object.freeze`).
- `columnIndexes` freezes the hash before memoizing it.
- `indexedRows` freezes the mapped array before memoizing it.
- The three members are typed `readonly` so an in-place mutation is a type error, the way
  `Errors#attributeNames` was typed in trails#8385.

## Acceptance criteria

- [ ] The three values are frozen at the Rails lines above and typed `readonly`.
- [ ] Any caller that mutated one in place is changed to copy first; `pnpm typecheck` is green.
- [ ] A `result.trails.test.ts` case asserts each is frozen on a fresh, unfrozen `Result`.
- [ ] `pnpm parity:api:calls` shows no new row for `result.rb`.
