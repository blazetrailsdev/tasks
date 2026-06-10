---
title: "insert_all: scope attributes must take precedence over row values"
status: claimed
updated: 2026-06-10
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 5
priority: 20
pr: null
claim: "2026-06-10T00:42:36Z"
assignee: "insert-all-scope-attribute-precedence"
blocked-by: null
---

## Context

Surfaced post-merge during #3007 (F-4 transactions/insert-all). In
`InsertAll#mapKeyWithValue` (`packages/activerecord/src/insert-all.ts:191`) the
per-row merge spreads the row last:

```ts
const merged = { ...this._scopeAttributes, ...row };
```

so a row key overrides the scope attribute. Rails does the opposite —
`map_key_with_value` builds `attributes` from the row, then
`attributes.merge!(scope_attributes)` (insert_all.rb), so **scope attributes win**.
A `Post.where(author_id: 1).insert_all([{ author_id: 2 }])` therefore writes
`author_id: 2` in trails but `author_id: 1` (the scope) in Rails.

Pre-existing; no test covers it today. Small, behavioral, worth tracking so it
isn't lost.

## Acceptance criteria

- `mapKeyWithValue` spreads scope attributes last (`{ ...row, ...scopeAttributes }`)
  so scope-supplied values override row-supplied values, matching Rails
  `attributes.merge!(scope_attributes)`.
- Add a test: an `insert_all`/`upsert_all` issued on a scoped relation whose scope
  sets a column also present in the row rows persists the scope's value.
- Re-check `insert-all.ts:223` (`rowKeys` union) still behaves correctly after the
  flip.
