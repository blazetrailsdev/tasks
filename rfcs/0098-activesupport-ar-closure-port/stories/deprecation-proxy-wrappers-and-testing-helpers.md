---
title: "Port deprecation/proxy_wrappers.rb and testing/deprecation.rb"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6461
claim: "2026-08-13T13:46:29Z"
assignee: "converge-collection-proxy-create-delegates-to-association"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6456, which took `deprecation.rb`, `deprecation/reporting.rb`,
`deprecation/disallowed.rb` and `deprecation/method_wrappers.rb` to 0 missing.
Two files in the same closure are still unported, per
`pnpm parity:api --package activesupport --missing`:

- `deprecation/proxy_wrappers.rb` → `deprecation/proxy-wrappers.ts`, 0/8:
  `new`, `initialize`, `warn`, `instance_methods`, `name`, `append_features`,
  `prepend_features`, plus the `DeprecatedObjectProxy` /
  `DeprecatedInstanceVariableProxy` / `DeprecatedConstantProxy` classes that use
  them (`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb`).
  `packages/activesupport/src/deprecation/proxy-wrappers.test.ts` exists as a
  15-line stub with no implementation behind it.
- `testing/deprecation.rb` → `testing/deprecation.ts`, 0/3: `assert_deprecated`,
  `assert_not_deprecated`, `collect_deprecations`
  (`vendor/rails/activesupport/lib/active_support/testing/deprecation.rb`).
  Several ported tests currently hand-roll the assertion these provide.

## Converged shape

`method_missing`-backed proxies: Ruby's `Module#method_missing` +
`instance_methods` port to the settled trails `method-missing-proxy.ts` idiom;
`append_features` / `prepend_features` are module-inclusion hooks with no TS
equivalent and belong in a `SKIP_GROUPS` entry with a reason, not a stub.

`assert_deprecated` yields and asserts a matching warning was collected via
`collect_deprecations`, which swaps `behavior` for a collector — the same shape
the ported deprecation tests already build by hand.

## Acceptance criteria

- Both Rails files report 0 missing (or reasoned SKIP rows for the inclusion
  hooks) in `pnpm parity:api --package activesupport`.
- `proxy-wrappers.test.ts` is enrolled against
  `vendor/rails/activesupport/test/deprecation/proxy_wrappers_test.rb` with Rails'
  test names verbatim, replacing the stub.
- parity:api / parity:test deltas non-negative.
