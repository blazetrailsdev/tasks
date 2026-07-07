---
title: "CollectionProxy#find resolves composite association_primary_key tuple on through associations"
status: ready
updated: 2026-07-07
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
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
