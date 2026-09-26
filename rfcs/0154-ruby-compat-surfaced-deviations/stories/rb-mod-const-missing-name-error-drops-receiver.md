---
title: "rbModConstMissing's NameError drops uninitialized_constant's receiver"
status: draft
updated: 2026-09-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

MRI's `uninitialized_constant` (`vendor/ruby/variable.c:2335-2342`) raises through
`rb_name_err_raise("uninitialized constant %2$s::%1$s", klass, name)`, so the `NameError` carries `klass` as its
`receiver` and `name` as its name. trails' `rbModConstMissing` (`packages/ruby-compat/src/variable.ts`, near line 35)
builds `new NameError(message, name)` with no `{ receiver: klass }`, so `NameError#receiver` raises
`ArgumentError("no receiver is available")` where Ruby returns the module. `rbConstGet` (trails#8119) and
`DeprecatedConstantAccessor#const_missing` both reach this raise.

## Acceptance criteria

- [ ] `rbModConstMissing` passes `{ receiver: klass }` on both arms, as `rb_name_err_raise(..., klass, name)` does.
- [ ] A ruby-compat test asserts that `receiver()` is the module and `constantName` is the missing name.
