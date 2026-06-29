---
title: "predicate-builder-blank-and-unboundable-contradiction"
status: ready
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
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

Converting `packages/activerecord/src/relation/where.test.ts` onto canonical
schema + fixtures (RFC 0019 `relation-where-core`) surfaced three related
predicate-builder fidelity gaps around blank / un-boundable WHERE values. Three
faithful ports of `where_test.rb` are skipped pending these:

- **Empty (nested/associated) hash → `1=0`.** Rails `expand_from_hash` returns
  `["1=0"]` for an empty hash (`predicate_builder.rb:85`), so
  `Post.where(posts: {})` and `Edge.where(sink: {})` match nothing. trails'
  `PredicateBuilder.buildFromHashInternal` expands the empty hash to zero
  predicate nodes, dropping the condition → all rows match.
  Skipped: `where with table name and empty hash`,
  `where with empty hash and no foreign key`.
- **Un-castable scalar → contradiction.** Rails treats a value whose type-cast
  is not boundable (`QueryAttribute#boundable?`) as `1=0`. trails casts e.g. a
  non-numeric string for an integer column to `null` → emits `IS NULL` → matches
  NULL rows instead of nothing. Skipped: `where with invalid value`.
- **Empty array `[]` as a blank top-level condition.** Rails ignores `[]` like
  `{}`/`nil`/`""` (returns all rows); trails routes `where([])` into the
  composite-key tuple form and raises ArgumentError. Skipped:
  `where with blank conditions`.
- **Out-of-range integer query value → contradiction.** Rails treats
  `9223372036854775808` (2^63, one past signed-bigint max) as un-boundable, so
  `where(id: [3, 2^63])` matches only id 3. trails' `MysqlBigInteger` / PG integer
  type raises `ActiveModelRangeError` when casting the out-of-range query bind
  (passes on sqlite, which has no range enforcement — an adapter split). Same
  `boundable?` mechanism as the un-castable-scalar case. Skipped (MariaDB/PG
  failure surfaced in CI): `where with large number`, `to sql with large number`.

## Acceptance criteria

- [ ] `PredicateBuilder` emits a `1=0` contradiction for an empty nested/associated
      hash (Rails `expand_from_hash` empty-hash branch).
- [ ] An un-boundable type-cast query value builds a contradiction, not `IS NULL`.
- [ ] An out-of-range integer query value (e.g. 2^63 for a bigint column) binds a
      contradiction instead of raising `ActiveModelRangeError` (consistent across
      sqlite / MariaDB / PG).
- [ ] Top-level `where([])` is treated as blank (no-op), matching `{}`/`nil`/`""`.
- [ ] Un-skip the six tests in `relation/where.test.ts` (remove the `it.skip`
      markers and the BLOCKED comments referencing this story); they pass on all
      three adapters.
