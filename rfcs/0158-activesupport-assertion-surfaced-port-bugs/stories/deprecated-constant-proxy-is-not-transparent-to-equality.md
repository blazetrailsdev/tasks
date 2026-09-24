---
title: "deprecated-constant-proxy-is-not-transparent-to-equality"
status: ready
updated: 2026-09-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`deprecation_test.rb:317-323` asserts `assert_equal Undeprecated::Foo::BAR,
proxy` inside `assert_deprecated("FUBAR")` — Ruby routes `==` through the
proxy's `method_missing`
(`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:110-126`),
so the proxy compares equal to its target and warns while doing it.

trails' `DeprecatedConstantProxy`
(`packages/activesupport/src/deprecation/proxy-wrappers.ts:108-193`) is a real
object behind a `get`-trap Proxy. JS equality is not a method call, so
`expect(proxy).toEqual(target)` compares the proxy object itself and neither
warns nor matches.

## Parked test

`packages/activesupport/src/deprecation.test.ts` › `DeprecatedConstantProxy`,
`it.skip` with the converged body and a `BLOCKED:
deprecated-constant-proxy-is-not-transparent-to-equality` line.

## Acceptance criteria

- [ ] Decide whether a `valueOf`/`Symbol.toPrimitive` seat makes the proxy
      compare equal to its target, or ratify the divergence with a receipt.
- [ ] `DeprecatedConstantProxy` runs unskipped and green, or carries a ratified
      receipt.
