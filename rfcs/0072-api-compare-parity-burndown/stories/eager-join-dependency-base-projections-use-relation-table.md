---
title: "eager-join-dependency-base-projections-use-relation-table"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5935
claim: "2026-08-02T23:55:47Z"
assignee: "eager-join-dependency-base-projections-use-relation-table"
blocked-by: null
closed-reason: null
---

## Context

Found while converging the last four `this._modelClass.arelTable` reads in
`packages/activerecord/src/relation.ts` (story
`converge-remaining-relation-arel-table-reads`, PR pending).

With the four reads routed through `Relation#table`, an aliased relation
(`new Relation(Post, Post.arelTable.alias("omg_posts"))`) now emits a correct
DISTINCT-pk materialization query and a correct `WHERE "omg_posts"."id" IN (…)`
rewrite, but the OUTER eager-load query still projects the JoinDependency's
columns off the model's own `arel_table`:

```sql
SELECT "posts"."id" AS t0_r0, … FROM "posts" "omg_posts"
  LEFT OUTER JOIN "comments" ON "comments"."post_id" = "omg_posts"."id"
  WHERE "omg_posts"."id" IN (1)
```

On SQLite this fails with `no such column: posts.id`. The JOIN condition is
already rooted on the alias; only the base node's column projections are not.
In Rails the eager projection comes from `JoinDependency#aliases` /
`construct_tables`, which build off the relation's table for the base node.

`packages/activerecord/src/relation/aliased-table-attr-reader.trails.test.ts`
documents the gap at the call site (the async materialized-limited-id test
swallows the outer query's failure).

## Acceptance criteria

- The eager-load JoinDependency's base-node column projections are rooted on the
  relation's table rather than `model.arelTable`, checked against the Rails
  body first.
- The trails test above drops its swallow and asserts the outer query succeeds
  on an aliased relation.
