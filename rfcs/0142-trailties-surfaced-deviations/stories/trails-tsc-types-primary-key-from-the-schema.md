---
title: "trails-tsc-types-primary-key-from-the-schema"
status: ready
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc` types a model's columns from `db/schema.ts`, but `post.id` stays
`PrimaryKeyValue` (`packages/activerecord/src/base.ts:362-364`:
`string | number | bigint | null | undefined`, or an array of those for composite keys).
The schema says `posts.id` is an integer primary key, so every caller that needs a
number narrows or casts.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

The model virtualizer types `id` from the table's primary key in the schema:
`number` for an integer / bigint PK (matching how the adapter casts it), `string`
for a uuid or string PK, and a tuple for a composite key. It is nullable only where
a new record can have no id. Rails' `id` reader
(`activerecord/lib/active_record/attribute_methods/primary_key.rb`) returns the cast
primary-key attribute, which is what this types.

## Acceptance criteria

- [ ] In a scaffolded app, `const n: number = (await Post.find(1)).id` type-checks under `trails-tsc`.
- [ ] Composite-key and uuid models are typed accordingly, with type tests.
