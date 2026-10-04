---
title: "activerecord: Base's _suppressInitializeCallback flag no longer has a Model reader"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Base`'s constructor (`packages/activerecord/src/base.ts`, the `_suppressInitializeCallback` block around
`super(attrs)`) sets the static `_suppressInitializeCallback = true` on the class for the duration of the
`ActiveModel::Model` constructor and restores it afterwards. It existed so that `Model`'s constructor would not
run the `initialize` chain a second time: `Base` runs it itself, as `ActiveRecord::Core#initialize` does through
`_run_initialize_callbacks` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:472`).

trails#8466 removed that run from `Model`'s constructor (`ActiveModel::API#initialize`,
`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:80-84`, runs no callbacks), so `Model` no longer reads
the flag. Its only remaining reader is `Base`'s own `wasSuppressed = allocating || previouslySuppressed`, which
is true only for a `new` of the same class nested inside that `super(attrs)` call. Rails has no such flag.
`core.trails.test.ts` ("allocate adds no class state of its own while it constructs") pins the flag as the one
class-state write `allocate` makes.

## Acceptance criteria

- [ ] `Base._suppressInitializeCallback` and the set / restore block around `super(attrs)` are deleted, or the story records which nested-construction case still needs the flag and why.
- [ ] `core.trails.test.ts`'s allocate test asserts no class-state change.
- [ ] `after_initialize` still runs exactly once per `new` and per `allocate` + `init_with_attributes` (existing `callbacks.test.ts` / `core.test.ts` stay green).
