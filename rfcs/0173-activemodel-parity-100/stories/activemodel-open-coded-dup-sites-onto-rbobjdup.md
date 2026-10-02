---
title: "activemodel's four open-coded Object#dup sites onto rbObjDup/rbObjClone"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8399
claim: "2026-10-02T14:02:12Z"
assignee: "arel-remaining-nil-sends-read-ruby-compat-is-nil"
blocked-by: null
closed-reason: null
---

## Context

trails#8290 made `rbObjDup` / `rbObjClone` (`packages/ruby-compat/src/include.ts`) the one spelling of
Ruby `obj.dup` / `obj.clone` (MRI `rb_obj_dup` / `rb_obj_clone`, `vendor/ruby/v3.3.11/object.c:536,591`),
and ratified it in CLAUDE.md. They copy the ivars and dispatch `initializeDup` / `initializeClone`,
falling back to `initializeCopy`. Four activemodel call sites still build the copy by hand with
`Object.assign(Object.create(Object.getPrototypeOf(this)), this)`:

- `packages/activemodel/src/errors.ts:297` `Errors#dup` + `initializeDup` (`activemodel/lib/active_model/errors.rb:77-80` defines only `initialize_dup`; `dup` is Object#dup)
- `packages/activemodel/src/error.ts:271`
- `packages/activemodel/src/attribute.ts:271`
- `packages/activemodel/src/attribute-set/builder.ts:295`

## Converged shape

Each site calls `rbObjDup(this)` / `rbObjClone(this)`, and the per-class `initialize_dup` /
`initialize_copy` bodies stay at their Rails names. Where the TS `dup()` method exists only to
spell Object#dup, it becomes the one-line `rbObjDup(this)`, like `Model#dup`.

## Acceptance criteria

- None of the four sites calls `Object.create` for the copy.
- The activemodel `dup` / `clone` tests stay green.
