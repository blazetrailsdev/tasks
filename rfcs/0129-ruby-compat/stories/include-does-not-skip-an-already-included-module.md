---
title: "include() re-copies an already-included module's members"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
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

`include()` (`packages/ruby-compat/src/include.ts`) copies a module's members
onto `klass.prototype` every time it is called, even when the module is already
in the class's or an ancestor's registry. Ruby does not: `include_modules_at`
walks the superclass chain and jumps to `skip` when it finds the module's method
table already there (`vendor/ruby/class.c:1281,1291,1296`), so `include Mod`
twice — or in a subclass whose parent already included it — splices one link,
not two.

PR #7561 converged the per-instance half only: `include()` now computes
`isModuleMethodTablePresent(klass, mod)` and skips registering the module's
`[initialize]` when it is already present. The method-copying pass below it
still runs unconditionally, so a re-include re-writes the prototype descriptors
and, through the `installed`/`trackedKeys` bookkeeping, can let a module member
overwrite a class-body member it should have lost to.

## Converged shape

Hoist the existing `alreadyIncluded` guard so it short-circuits the whole of
`include()` — the plain-object, class-shaped and `Module` branches alike — the
way `include_modules_at`'s `skip` does, leaving the `included` hook firing
semantics to match Ruby's (`rb_mod_include`, `vendor/ruby/eval.c:1139`).

## Acceptance criteria

- A second `include(Klass, mod)` with the same module object is a no-op.
- `include(Sub, mod)` where `Base` already included `mod` is a no-op.
- A class-body member is not clobbered by a re-include of a module that lost to
  it the first time.
- Tests in `packages/ruby-compat/src/include.test.ts` cover all three.
