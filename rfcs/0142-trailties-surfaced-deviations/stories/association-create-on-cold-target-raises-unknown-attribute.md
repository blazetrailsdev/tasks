---
title: "owner.assoc.createBang on a not-yet-reflected target model raises UnknownAttributeError"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: boot
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8197
claim: "2026-09-27T22:39:57Z"
assignee: "map-rubocop-to-eslint-in-token-renames"
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the root README quickstart (2026-09-27, main `b4f622ae87`).
Filed under 0142 because a generated app hits it and no activerecord
surfaced-deviations bucket is active.

In a fresh `trails new` app (sqlite) with `Post hasMany comments` and a
`comments(body text, flagged boolean, post_id)` table, the README's
association example raises on the first call in a fresh process:

```ts
const post = await Post.createBang({ title: "Hello", slug: "hello" });
await post.comments.createBang({ body: "First!", flagged: false });
// UnknownAttributeError: unknown attribute 'body' for Comment.
//   at Comment.attributeWriterMissing (packages/activemodel/src/attribute-assignment.ts:57)
//   at new Comment -> HasManyReflection.buildAssociation (packages/activerecord/src/reflection.ts:149)
```

With `await Comment.loadSchema()` run first, the same call succeeds.

- The class-level create paths warm the schema before constructing:
  `create` / `createBang` call `await this.ensureSchemaLoaded()`
  (`packages/activerecord/src/persistence.ts:61`, `:88`), the warm
  CLAUDE.md § "Schema reflection peeks at a warm cache" makes explicit.
- `CollectionAssociation#_createRecord`
  (`packages/activerecord/src/associations/collection-association.ts:240-275`)
  goes straight to the synchronous `buildRecord` with no warm of `klass`, so a
  cold target is constructed attribute-less and the assignment raises. The
  singular path (`singular-association.ts:130`) and the `Association#_createRecord`
  fallback (`association.ts:383`) should be checked too, along with `build` /
  `new` reached after an await.
- Rails: `collection_association.rb:354-373` calls `build_record` directly,
  and `load_schema!` reflects synchronously on first attribute access
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:587-597`),
  so the cold state is unobservable there.

Prior art: `through-join-build-needs-async-schema-warm` (0023, closed) asked for
a single chokepoint warm for exactly this class of site, and was closed as "an
architecture decision, not a convergence". This story is the user-facing
symptom on the most common association write. It is the same pre-construction
warm `Persistence.create` already carries, so it is not a new decision.

## Acceptance criteria

- `owner.assoc.create` / `createBang` (collection and singular) on a target
  model whose schema has not been reflected in this process succeeds, by
  awaiting the target klass's schema warm before `buildRecord`, as
  `Persistence.create` does.
- A `.trails.test.ts` reproduces the cold case: a fresh model class, no prior
  query against its table, then `owner.assoc.createBang({...})`. It fails on
  main and passes after the fix.
