---
title: "trails-tsc-types-primary-key-from-the-schema"
status: done
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: 1
pr: trails#9355
claim: "2026-10-27T00:02:19Z"
assignee: "generated-app-needs-non-null-assertions-on-trails-application"
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

The virtualizer skips the `id` column outright (`packages/activerecord-cli/src/type-virtualization/synthesize.ts:166`, `if (col === "id") continue;`), though the schema parser already records its type (`activerecord-cli/src/tsc-wrapper/schema-ts-model-parser.ts:24-43`, `idColumn`).

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
