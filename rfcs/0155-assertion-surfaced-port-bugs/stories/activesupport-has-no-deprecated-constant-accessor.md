---
title: "activesupport-has-no-deprecated-constant-accessor"
status: in-progress
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8018
claim: "2026-09-23T23:33:09Z"
assignee: "activesupport-delegate-private-and-ruby-method-semantics"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Deprecation::DeprecatedConstantAccessor`
(`vendor/rails/activesupport/lib/active_support/deprecation/constant_accessor.rb`)
gives a module `deprecate_constant "OLD", "NEW", deprecator:`, which defines a
`const_missing` that warns and resolves. trails has no port: nothing under
`packages/activesupport/src/deprecation/` defines it, and
`proxy-wrappers.ts` stops at `DeprecatedConstantProxy`.

`deprecation_test.rb:348-380` covers it in three tests.

## Parked tests

`packages/activesupport/src/deprecation.test.ts`, `it.skip` with converged
bodies and a `BLOCKED: activesupport-has-no-deprecated-constant-accessor` line:

- `deprecate_constant`
- `deprecate_constant when rescuing a deprecated error`
- `deprecate_constant requires a deprecator`

## Acceptance criteria

- [ ] `DeprecatedConstantAccessor` is ported into
      `packages/activesupport/src/deprecation/constant-accessor.ts`, mirroring
      `constant_accessor.rb` method for method.
- [ ] The three parked tests run unskipped and green with their converged
      bodies unchanged.
