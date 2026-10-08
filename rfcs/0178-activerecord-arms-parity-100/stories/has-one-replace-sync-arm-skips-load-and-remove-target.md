---
title: "HasOne#replace's save=false arm is a second body that skips load_target and remove_target!"
status: claimed
updated: 2026-10-08
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: "2026-10-08T21:33:16Z"
assignee: "connection-adapters-load-is-an-awaited-require-split-from-resolve"
blocked-by: null
closed-reason: null
---

## Context

`HasOneAssociation#replace` (`packages/activerecord/src/associations/has-one-association.ts`) is two bodies behind `if (save)`. The `save = true` arm is Rails' `replace` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_one_association.rb:59-85`) with awaits. The `save = false` arm, reached from `syncWrite` and `setNewRecord` (`has_one_association.rb:91-93`), is a synchronous copy that skips `load_target` (`:62`), skips `transaction_if` (`:68`) and inlines the `else` arm of `remove_target!` (`:108-119`) instead of calling it, so a `:delete` / `:destroy` dependent is never applied on that path.

Two bodies hang off the same split:

- `HasOneAssociation#_createRecord` calls `loadDisplacedTargetForCreate` before `super` and re-raises its captured error afterwards. Rails' body is the `owner.persisted?` guard and `super` (`has_one_association.rb:131-137`).
- `HasOneThroughAssociation#replace` (`has-one-through-association.ts`) branches on `created instanceof Promise`. Rails is `create_through_record(record, save); self.target = record` (`has_one_through_association.rb:10-13`).

All three carry `@inventedArm … — CONVERGEABLE` receipts pointing here.

## Acceptance criteria

- [ ] `HasOneAssociation#replace` is one body with Rails' seven branches in Rails' order; `replace(record, false)` reaches `load_target` and `remove_target!`.
- [ ] `HasOneAssociation#_createRecord` is the guard plus `super`; `loadDisplacedTargetForCreate` is deleted.
- [ ] `HasOneThroughAssociation#replace` has no `instanceof Promise` arm.
- [ ] The three `@inventedArm` receipts are deleted and `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no row for these methods.
