---
title: "trails-models-dump: a named primary key is reported as id"
status: in-progress
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#9402
claim: "2026-10-28T14:43:06Z"
assignee: "split-the-render-pages-the-rails-way-story"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord-cli/src/tsc-wrapper/schema-ts-model-parser.ts` has its
own `synthesizePk` (lines 19-44), separate from the one in
`schema-ts-parser.ts`. It hard-codes `primaryKey: "id"` and
`idColumn.name: "id"`, and recognises only `id: "uuid"`.

It is not on the `trails-tsc` path: its only caller is
`src/bin/trails-models-dump.ts`. But since trails#8825 the two parsers
disagree about the same `createTable` options. For
`{ primaryKey: "key", id: "string" }` (trailmap's `meta` and `settings`)
`schema-ts-parser` yields a `key: string` column and no `id`, while the model
parser still reports `id: bigint` — so `trails-models-dump` describes a
primary key the table does not have.

## Acceptance criteria

- `parseSchemaForModels` reports the declared primary key name and `id:` type
  for a named primary key, agreeing with `parseSchemaTs` on the same source.
- The two `synthesizePk` functions share one implementation, or the reason
  they cannot is stated where they diverge.
- Test in `schema-ts-model-parser.test.ts` for
  `{ primaryKey: "key", id: "string" }`.
