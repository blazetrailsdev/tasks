---
title: "activerecord: withRoleAndShard loads an async block's Relation without an invented arm"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

Rails' `with_role_and_shard`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:394-403`) is

```ruby
return_value = yield
return_value.load if return_value.is_a? ActiveRecord::Relation
return_value
```

so a Relation the block returns is loaded while the role/shard entry is still
on `connected_to_stack`. trails' `withRoleAndShard`
(`packages/activerecord/src/connection-handling.ts`) takes the same two Rails
arms, plus one Rails does not have: when the block is `async` its value arrives
through a promise, so the body tests `returnValue instanceof Promise` and runs
the Relation check in a `.then`. `connection-handling.test.ts` "calls .load()
on a Relation returned from an async block" (a `stripThenable`d Relation out of
an `async` block) pins that arm.

The arm carries `@inventedArm if — CONVERGEABLE <this story>` on the
declaration. The `rbEnsure` wrapping the body already defers the
`connected_to_stack.pop` to the promise's settle, so only the Relation check is
left outside Rails' shape.

## Acceptance criteria

- [ ] `withRoleAndShard` takes Rails' arms only (`try if if`), with the block's
      promised value handled by a settled repo-wide idiom rather than an
      `instanceof Promise` test in the body, OR the arm is ratified in CLAUDE.md
      by the repo owner and the receipt becomes `PERMANENT`.
- [ ] `pnpm parity:api:arms:throws` is green and the receipt is gone or PERMANENT.
- [ ] "calls .load() on a Relation returned from an async block" still passes.
