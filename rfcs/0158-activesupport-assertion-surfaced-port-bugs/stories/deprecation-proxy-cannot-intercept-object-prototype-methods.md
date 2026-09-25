---
title: "deprecation-proxy-cannot-intercept-object-prototype-methods"
status: done
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8063
claim: "2026-09-24T22:24:17Z"
assignee: "deprecation-proxy-cannot-intercept-object-prototype-methods"
blocked-by: null
closed-reason: null
---

## Context

Ruby's deprecation proxies inherit from a stripped `BasicObject` and reach
`method_missing` for `to_s`, `size` and friends
(`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:7-24`).
`deprecation_test.rb:290-300` reads `instance.fubar.size` and
`instance.fubar.to_s` through a `DeprecatedInstanceVariableProxy` and expects
both to warn AND to answer the target's values.

trails' `undefMethodProxy`
(`packages/activesupport/src/deprecation/proxy-wrappers.ts:13-22`) forwards only
names `Reflect.has(target, prop)` says are absent, so `toString` — present on
`Object.prototype` — is answered by the proxy instance without warning, and
`size` has no JS twin at all (a JS string answers `length`).

## Parked test

`packages/activesupport/src/deprecation.test.ts` ›
`DeprecatedInstanceVariableProxy`, `it.skip` with the converged body and a
`BLOCKED: deprecation-proxy-cannot-intercept-object-prototype-methods` line.

## Acceptance criteria

- [ ] `undefMethodProxy` intercepts inherited `Object.prototype` names the way
      `BasicObject` does (or the divergence is ratified with a receipt).
- [ ] `DeprecatedInstanceVariableProxy` runs unskipped and green with its
      converged body unchanged.
