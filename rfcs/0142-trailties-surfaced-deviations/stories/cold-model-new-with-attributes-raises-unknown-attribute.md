---
title: "cold-model-new-with-attributes-raises-unknown-attribute"
status: in-progress
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8258
claim: "2026-09-30T02:21:48Z"
assignee: "cold-model-new-with-attributes-raises-unknown-attribute"
blocked-by: null
closed-reason: null
---

## Context

On a model whose schema has not been loaded yet in the process,
`Post.new({ title: "x" })` raises `UnknownAttributeError: unknown attribute
'title' for Post.`, while `await Post.create({ title: "x" })` works.
Reproduced in a fresh `trails new` app with a plain script:

```ts
import "../config/environment.js";
import { Post } from "../app/models/post.js";
Post.new({ title: "x" }); // UnknownAttributeError
await Post.create({ title: "y" }); // ok
```

The scaffold's `create` action is `this.post = Post.new(this.postParams())`
then `save`, per Rails' `controller.rb.tt`. So on a freshly started
`trails server`, if the first request is a form POST, it answers 500. It works
once any read has loaded `Post`'s schema.

In Rails, `new` reaches `_default_attributes` → `load_schema`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:587-597`)
synchronously. In trails a cold schema peek answers "not loaded" by design
(CLAUDE.md, "Schema reflection peeks at a warm cache"), and
`create` / `createBang` park the assignment and drain it after warming. A plain
`new` has no such path.

## Converged shape

Keep `new` synchronous. Warm the schema before user code can reach a cold `new`:
a booted app (`trails server`, `runner`, scripts through
`config/environment`) warms each model's schema as part of boot, through the
ratified async warm (`loadSchemaFromAdapter` /
`SchemaReflection.eagerLoadSchemaCache`), the way Rails'
`eager_load_schema_cache` / `load_schema` would have loaded it on first touch.
Decide where in the initializer order that belongs, and cite the Rails
initializer it hangs off.

## Acceptance criteria

- [ ] In a booted generated app, `Post.new({ title: "x" })` works as the first
      model access.
- [ ] A freshly started `trails server` answers a first-request scaffold form
      POST without `UnknownAttributeError`.
