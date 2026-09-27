---
title: "trails-tsc types an enum attribute as its column and declares scopes only as statics"
status: ready
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the root README's zero-`declare` claims (2026-09-27,
main `b4f622ae87`). Filed under 0142 because a generated app hits it and no
activerecord surfaced-deviations bucket is active.

Setup: a fresh `trails new` app with `Post` carrying
`this.scope("published", function () { return this.where({ published: true }); })`,
`this.scope("authoredBy", function (author: Author) { return this.where({ author }); })`
and `this.enum("status", { draft: 0, published: 1, archived: 2 }, { prefix: true })`
over an `integer` `status` column. Under `trails-tsc --schema db/schema.ts`:

1. **An enum attribute keeps its column type.** `post.status` is typed
   `number | null`, but at run time it reads `"published"`, the enum's cast
   string. Rails' `EnumType#deserialize` returns the mapping key
   (`vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb`, `EnumType`).
   `renderEnum` (`packages/activerecord/src/type-virtualization/synthesize.ts:327-354`)
   emits the predicates, bang writers and class scopes, but does not override
   the attribute's type. `renderAttribute` (`:268-281`) types the column from
   the schema alone.
2. **Scopes are typed only as statics.** `renderScope` (`synthesize.ts:315-324`)
   emits `declare static <name>: (...) => Relation<Post>`. So
   `Post.published().authoredBy(author)` fails with
   `TS2339: Property 'authoredBy' does not exist on type 'Relation<Post>'`,
   even though the chain runs and emits the right SQL at run time. Rails'
   `scope` defines the method on the relation delegate as well as on the class
   (`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping/named.rb`, `scope`,
   `generate_relation_method`). Enum scopes (`renderEnum`) have the same gap.

## Acceptance criteria

- An enum-backed attribute is typed as the union of its mapping keys (plus
  `null` where the column is nullable), not the column's type.
- Scope and enum-scope names are callable on `Relation<Model>` (and
  association relations) under `trails-tsc`, with the scope's parameter list.
- `virtualize.trails.test.ts` covers both: `post.status` typed as the key
  union, and `Model.a().b(x)` for two scopes typechecks.
