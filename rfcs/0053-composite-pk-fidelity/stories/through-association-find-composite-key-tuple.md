---
title: "CollectionProxy#find resolves composite association_primary_key tuple on through associations"
status: closed
updated: 2026-07-09
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Mis-specified: premise contradicted by Rails. Story assumes blogPost.tags.find([blog_id, id]) should resolve the tuple as one composite key, but sharded_tags has a scalar DB primary key (schema.rb:351 create_table default; only name+blog_id added). Sharded::Tag gets its composite-ness purely from query_constraints :blog_id, :id, and query_constraints (persistence.rb:212-217) sets only @query_constraints_list -- it does NOT touch primary_key or composite_primary_key?. Rails find (finder_methods.rb:491-539) branches on model.composite_primary_key?, which is false here, so find([blog_id, id]) is treated as an id-list of 2 -> where(id: [blog_id, id]) -> 'found 1, looking for 2' RecordNotFound. That RecordNotFound is exactly what the story quotes as the bug -- it is Rails-faithful. No Rails test exists for composite-tuple find on a query_constraints model (checked finder_test.rb + query_constraints sites). Implementing the acceptance criteria would make trails MORE composite-aware than Rails, a divergence not convergence. Per 'always converge, never ratify', converging here means leaving trails as-is."
---

## Context

While adding the composite-source-PK test for PR #4739
(`has-many-through-associations.test.ts`, `Sharded::BlogPost#tags`), I found
that `CollectionProxy#find` on a through association whose source
`association_primary_key` is composite treats a composite-key tuple as an
id _list_, not a single composite key.

Calling `blogPost.tags.find([blog_id, id])` raised:

````text
RecordNotFound: Couldn't find all ShardedTags with 'id': (969142904, 50579271)
[WHERE "sharded_blog_posts_tags"."blog_id" = 969142904 AND ... blog_post_id = ...]
(found 1 results, but was looking for 2).
```text

The tuple `[blog_id, id]` was split into two scalar ids rather than matched as
one composite key. The find routes through the through-scope DB query
(`collection-proxy.ts:3346` → `finder-methods.ts#performFind`), not the
in-memory `findByScan` (`collection-association.ts:1053-1089`) which already
handles composite tuples via per-element normalize.

`primaryKeyValue` (fixed in #4739) now correctly returns the composite
`[blog_id, id]`, so the in-memory comparison paths are right — but the
DB-backed `find(compositeKey)` path on a through association is still wrong.

## Acceptance criteria

- `throughAssoc.find([k1, k2])` on a composite-source-PK through association
  resolves the single record matching that composite key (not an id-list of 2).
- Mirror the relevant Rails test if one exists; otherwise a canonical
  `Sharded::BlogPost#tags` trails assertion.
- No behavior change for scalar-PK `find(id)` / `find(id1, id2)` multi-arg.
````
