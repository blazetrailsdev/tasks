---
title: "delete_all: composite-PK limited/ordered subselect (currently falls through to plain delete)"
status: done
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3277
claim: "2026-06-14T18:42:34Z"
assignee: "delete-all-composite-pk-limited-subselect"
blocked-by: null
---

## Context

Surfaced during PR #3239 (f9h). The limited/ordered `deleteAll` subselect path
(`relation.ts` ~3409) is guarded by `typeof primaryKey === "string"`, so a
composite-PK model with `.limit/.offset/.order` falls through to the plain
`DeleteManager` (deletes every matching row) instead of emitting a subselect.

Rails handles composite keys explicitly (`relation.rb:1029-1031`):
`key = primary_key.map { |pk| table[pk] }` and `compile_delete` builds a
row-value `WHERE (pk1, pk2) IN (SELECT pk1, pk2 …)`. The TS `compileDelete` /
`subselectKey` visitor path currently assumes a single key Node, so composite
support needs the Arel side extended too.

No test currently exercises composite-PK limited delete; this is a latent gap,
not a regression.

## Acceptance criteria

- Composite-PK relations with limit/offset/order in `deleteAll` emit the
  row-value `IN (SELECT …)` subselect matching Rails.
- Arel `compileDelete` / DeleteStatement visitor accept a composite key
  (array of column nodes) and render the row-value tuple.
- Mirror the relevant Rails composite-PK `delete_all` test verbatim.
