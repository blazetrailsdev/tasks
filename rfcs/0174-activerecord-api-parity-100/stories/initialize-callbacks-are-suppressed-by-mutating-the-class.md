---
title: "activerecord/activemodel: Model's constructor runs initialize callbacks unless a class flag says not to, so every new and allocate writes and deletes it; Rails runs them from core.rb:481/517/553"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord", "activemodel"]
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails runs a record's initialize callbacks from Active Record itself, at the end of each construction path:
`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:481` (`initialize`), `:517` (`init_with_attributes`) and `:553` (`initialize_dup`), all `_run_initialize_callbacks`. The callback is Active Record's (`callbacks.rb:415`, `define_model_callbacks :initialize, :find, :touch, only: :after`). `ActiveModel::API#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:47`) runs no callbacks.

trails runs them from activemodel's `Model` constructor (`packages/activemodel/src/model.ts`): `runCallbacks(this, "initialize")` unless the class's `_suppressInitializeCallback` is `true`. So Active Record's constructor (`packages/activerecord/src/base.ts`) sets that flag on the class around every `super(attrs)` and restores it — with `delete` when the class had no own value — and then runs the callbacks itself, after its STI, scope-attribute and association work. Every `new` and every `allocate` therefore writes and deletes a property on the class object.

After trails#8433 that is the only class write left on the record-load path. On trailmap's `Story` over 11,531 rows it is most of the remaining gap to `7cece02d`: `Story.all()` 1.16–1.48 s against 0.91–1.11 s. With no class writes at all, measured 0.71 s.

## Converged shape

`Model`'s constructor runs no initialize callbacks, as `ActiveModel::API#initialize` does not; Active Record runs `_run_initialize_callbacks` itself at the three sites `core.rb` does. `_suppressInitializeCallback` and its set-and-delete in `allocate` and the `Base` constructor are deleted. A plain activemodel class that declares initialize callbacks keeps whatever behaviour Rails gives it, which is decided against `active_model/callbacks.rb` before anything is removed.

## Acceptance criteria

- [ ] No construction path sets or deletes a property on the class.
- [ ] Initialize callbacks run once, after the same work, on `new`, on load and on `dup`, as at `core.rb:481`, `:517` and `:553`; the existing callback tests pass unchanged.
- [ ] `_suppressInitializeCallback` is gone.
- [ ] Loading trailmap's 11,531 stories is at or below `7cece02d`'s ~1.0 s.
