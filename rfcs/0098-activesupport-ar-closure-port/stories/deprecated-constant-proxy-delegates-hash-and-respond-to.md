---
title: "DeprecatedConstantProxy delegates hash and respond_to? to target"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6468
claim: "2026-08-13T15:19:07Z"
assignee: "merge-clauses-where-clause-structure"
blocked-by: null
closed-reason: null
---

## Context

`DeprecatedConstantProxy` delegates four methods to its target in Rails
(`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:145`):

    delegate :hash, :instance_methods, :name, :respond_to?, to: :target

PR #6461 ported `instanceMethods` and `name`; `hash` and `respond_to?` were left
out because both sit in `SKIP_GROUPS` in `scripts/parity/conventions.ts` (they are
Ruby-universal object methods with no general TS spelling), so `parity:api` scores
the file 7/7 without them.

The skip entry is about the _general_ case — it is not a licence to drop a
delegation Rails writes explicitly in this file. The comment above the delegate
line says why they exist: "Don't give a deprecation warning on methods that IRB
may invoke during tab-completion." Without them, a `respond_to?`-style probe on
the proxy routes into `method_missing` and emits a spurious deprecation warning,
which is exactly the bug the delegation prevents.

`packages/activesupport/src/deprecation/proxy-wrappers.ts:216-222` holds the two
that were ported, so the shape to extend is already there.

## Converged shape

Add the remaining two delegations at the same site: `hash` (trails' `hash`
convention for Ruby `Object#hash`) and the `respond_to?` analogue, both reading
through the `target` getter, and both reached through `undefMethodProxy`'s
`Reflect.has` arm so they never fall into `method_missing`.

## Acceptance criteria

- All four names Rails delegates are answered from `target` without warning.
- A `respond_to?`-shaped probe on the proxy emits no deprecation warning
  (regression test that fails on the pre-fix baseline).
- No new `SKIP_GROUPS` or baseline rows.
