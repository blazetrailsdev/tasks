---
title: "activerecord: Relation#initialize takes Rails' keywords so Delegation.create forwards without unpacking"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Landed: origin/main relation.ts:366-374 Relation's constructor is `(model, { table = null, predicateBuilder = null, values = {} })`, Rails' relation.rb:77 keywords; `git grep 'const \\[kwargs\\]' origin/main -- packages/activerecord/src/relation/delegation.ts` is empty."
---

## Context

Surfaced by trails#8343. Rails' `Relation#initialize` takes the model and keywords only
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:77`):

```ruby
def initialize(model, table: nil, predicate_builder: nil, values: {})
```

and `Delegation::ClassMethods#create` forwards everything
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:139-141`):

```ruby
def create(model, ...)
  relation_class_for(model).new(model, ...)
end
```

trails' `Relation` constructor (`packages/activerecord/src/relation.ts`) is positional —
`(model, table?, predicateBuilder?, values = {})` — so `create`
(`packages/activerecord/src/relation/delegation.ts`) cannot forward a Rails kwargs hash. Since
trails#8343 it forwards positional arguments, but still carries an arm Rails does not have:

```ts
const [kwargs] = args;
if (isPlainObject(kwargs)) args = [kwargs.table, kwargs.predicateBuilder];
```

The kwargs callers are `AbstractReflection#buildScope` (`packages/activerecord/src/reflection.ts`,
Rails `reflection.rb` `build_scope`) and `HashMerger#other`
(`packages/activerecord/src/relation/merger.ts`, Rails `relation/merger.rb:22-31`). Positional
callers of the constructor: `CollectionProxy`'s `super(klass, klass.arelTable)`
(`packages/activerecord/src/associations/collection-proxy.ts`) and seven test files that write
`new Relation(Model, tableAlias)` where Rails' tests write `Relation.new(Post, table: table_alias,
predicate_builder: …)`.

## Converged shape

`constructor(model, { table, predicateBuilder, values = {} } = {})`, the trails kwargs idiom, and
`create` is exactly `new (relationClassFor.call(this, model))(model, ...args)` with no
`isPlainObject` arm.

## Acceptance criteria

- [ ] `Relation`'s constructor takes Rails' keywords as one options argument.
- [ ] `Delegation.create` has no kwargs-unpacking arm.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` stay green.
