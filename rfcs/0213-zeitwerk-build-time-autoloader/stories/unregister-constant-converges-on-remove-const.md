---
title: "unregister-constant-converges-on-remove-const"
status: draft
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
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

`unregisterConstant(name, expected)` (`packages/ruby-compat/src/variable.ts:65`) survives trails#9681, which deleted `registerConstant`. Its body is `rb_const_remove` (`vendor/ruby/v3.3.11/variable.c:3313`) on the owner a `::` path names, with an `expected`-value guard. MRI's public surface for that is `Module#remove_const`, which ruby-compat already ports as `rbModRemoveConst(mod, name)` (`variable.ts`, `rb_mod_remove_const`, `variable.c:3302`). The test suites call `unregisterConstant` in `afterEach` / `afterAll` teardown (about 60 sites, `grep -rn unregisterConstant packages`). Reviewer note on trails#9681.

## Acceptance criteria

- `unregisterConstant` is deleted. Each caller uses `rbModRemoveConst(owner, name)` on the owner the constant was seated on. Where a teardown may run after the seat was already replaced, the caller guards it with `constDefined(owner, name, false)`.
- `isRegisteredConstant` / `registeredConstant` callers outside ruby-compat move to `constDefined` / `constGet` where the read is a Ruby `const_defined?` / `const_get`.
- ruby-compat's `index.ts` no longer exports `unregisterConstant`, and `parity:api:extra:gate` for ruby-compat is at or below its mark.
