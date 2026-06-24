---
title: "Serialize where-predicate value through coder for serialized columns"
status: ready
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Querying a `serialize`-wrapped column does not run the coder's `dump` on the
predicate value, so callers must pass the already-encoded payload. Rails casts
the query value through the attribute's type (which serializes via the coder),
so a plain Ruby value matches the stored serialized blob:

`vendor/rails/activerecord/test/cases/serialization_test.rb:100-105`

```ruby
author.serialized_posts.create!(title: "Hello")
Author.joins(:serialized_posts).where(name: "David", serialized_posts: { title: "Hello" }).length # => 1
```

In trails this returns 0 unless the predicate is pre-encoded. Surfaced while
porting `default_column_serializer` (PR #4080): `serialization.test.ts`'s
`find records by serialized attributes through join` had to query
`title: "Hello\n"` (the YAML-dumped form) instead of `"Hello"`, mirroring the
pre-existing JSON-era workaround (it previously queried `JSON.stringify("Hello")`).

The predicate-builder / where-clause path does not invoke `Type::Serialized#serialize`
on the bound value the way a write does (`type/serialized.ts:121-129`).

## Acceptance criteria

- A `where`/`joins(...).where` predicate on a serialized column accepts a
  plain (un-encoded) value and serializes it through the column's coder before
  binding, matching `serialization_test.rb:100-105`.
- Re-port `serialization.test.ts` `find records by serialized attributes
through join` to query the plain value `"Hello"` (drop the `"Hello\n"`
  pre-encoding workaround) and keep it green.
- Audit other serialized-column `where` queries for the same pre-encoding
  workaround and converge them.
