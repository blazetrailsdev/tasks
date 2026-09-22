---
title: "activesupport-has-no-module-deprecate"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Rails' `Module#deprecate`
(`vendor/rails/activesupport/lib/active_support/core_ext/module/deprecation.rb:23-25`)
is `deprecator.deprecate_methods(self, *method_names, **options)` with
`deprecator:` a REQUIRED keyword, so `klass.deprecate :zero` raises
`ArgumentError`. trails ports only the receiver half
(`packages/activesupport/src/deprecation/method-wrappers.ts`'s
`deprecateMethods`), which defaults `deprecator` to `this` and can never raise.

`deprecation_test.rb:107-112` is the test.

## Parked test

`packages/activesupport/src/deprecation.test.ts` › `Module::deprecate requires
a deprecator`, `it.skip` with the converged body and a `BLOCKED:
activesupport-has-no-module-deprecate` line. The file's other `Module::deprecate`
tests converge onto `deprecateMethods` directly and are green.

## Acceptance criteria

- [ ] `Module#deprecate` is ported to
      `packages/activesupport/src/core-ext/module/deprecation.ts` with its
      required `deprecator` kwarg.
- [ ] `Module::deprecate requires a deprecator` runs unskipped and green with
      its converged body unchanged.
