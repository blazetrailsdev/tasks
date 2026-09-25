---
title: "pluck-hash-argument-drops-leading-scalar-column"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: ["sqlite3-perform-query-positional-result"]
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8089
claim: "2026-09-25T15:56:39Z"
assignee: "pluck-hash-argument-drops-leading-scalar-column"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `calculations_test.rb` assertions for
`assertions-tail-root-7`.

`Relation#pluck` drops a leading scalar column when a hash argument follows it.

Rails (`vendor/rails/activerecord/test/cases/calculations_test.rb:1024-1033`):

```ruby
expected = [
  [1, 1, "Thank you for the welcome"],
  [1, 2, "Thank you again for the welcome"],
  [2, 3, "Don't think too hard"]
]
assert_equal expected, Post.joins(:comments).order(posts: { id: :asc }, comments: { id: :asc }).limit(3).pluck(:id, comments: [:id, :body])
assert_equal expected, Post.joins(:comments).order(posts: { id: :asc }, comments: { id: :asc }).limit(3).pluck(posts: :id, comments: [:id, :body])
assert_equal expected, Post.joins(:comments).order(posts: { id: :asc }, comments: { id: :asc }).limit(3).pluck(posts: [:id], comments: [:id, :body])
```

trails returns two columns instead of three — the `posts.id` half is dropped.
Probed directly on `origin/main` (sqlite3):

```text
Post.joins(":comments").order({ posts: { id: "asc" }, comments: { id: "asc" } })
    .limit(3).pluck("id", { comments: ["id", "body"] })
  => [[1,"Thank you for the welcome"],[2,"Thank you again for the welcome"],[3,"Don't think too hard"]]

… .pluck({ posts: "id", comments: ["id", "body"] })   => same two-column result
```

Parked in `packages/activerecord/src/calculations.test.ts` with a converged
body and a `BLOCKED:` line: `pluck with hash argument with multiple tables`.

Rails source: `activerecord/lib/active_record/relation/calculations.rb`
(`pluck`, and the hash expansion in `arel_columns` /
`QueryMethods#arel_column`).

## Acceptance criteria

- [ ] All three spellings above return the three-column `expected` tuples.
- [ ] The parked test in `calculations.test.ts` is un-skipped and passes with
      its converged body unchanged.
