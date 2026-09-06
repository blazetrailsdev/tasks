---
title: "serializable-add-includes-has-a-third-raw-passthrough-arm"
status: draft
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
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

`activemodel/lib/active_model/serialization.rb:143-147` writes the `include:`
arm with exactly two branches and no discriminator on the record itself:

```ruby
hash[association.to_s] = if records.respond_to?(:to_ary)
  records.to_ary.map { |a| a.serializable_hash(opts) }
else
  records.serializable_hash(opts)
end
```

`packages/activemodel/src/serialization.ts` (the `serializableAddIncludes`
callback inside `serializableHash`) has **three**: the `to_ary` arm, a middle
arm gated on the record exposing an `_attributes` store or an `attributes`
reader, and a third arm that writes `records` into the hash raw. Rails has no
third arm — a record that does not answer `serializable_hash` raises
`NoMethodError` there.

PR #7577 widened the middle arm's discriminator from `_attributes` alone to
`_attributes || attributes`, because the newly ported
`test-helpers/models/address.ts` (Rails `activemodel/test/models/address.rb`)
exposes only the latter. That is a widening of an existing deviation, not a
convergence, and is filed here rather than left silent.

The raw-passthrough arm is pinned by
`serialization.trails.test.ts`'s `"awaited nested include preloads through an
attributes-less PORO"`, whose `author` is a bare `{ name, comments }` object.
Converging the branch to Rails' two arms makes that PORO serialize as `{}`, so
the story has to decide what that trails-only case should assert — Rails would
raise `NoMethodError` on it.

## Acceptance criteria

- [ ] `serializableHash`'s `include:` callback has Rails' two branches: the
      `to_ary` arm and `records.serializable_hash(opts)`; the record-shape
      discriminator and the raw-passthrough arm are gone.
- [ ] `serialization.trails.test.ts`'s attributes-less-PORO case is resolved —
      retargeted at the Rails behaviour or removed — without renaming it.
- [ ] `json-serialization.test.ts`'s three `include:` tests keep passing.
- [ ] `pnpm parity:api:calls` and `parity:test` do not regress.
