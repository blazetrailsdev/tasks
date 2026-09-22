---
title: "deprecated-constant-proxy-does-not-raise-on-a-missing-child-constant"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

`deprecation_test.rb:332-337` reads `proxy::DOES_NOT_EXIST` through a
`DeprecatedConstantProxy` and expects a warning AND a `NameError` — Ruby's
constant lookup on the resolved target raises.

trails' `DeprecatedConstantProxy#methodMissing`
(`packages/activesupport/src/deprecation/proxy-wrappers.ts:191-197`) reads
`(this.target as Record<string, unknown>)[called]` and returns `undefined` for
an absent name, so nothing raises.

## Parked test

`packages/activesupport/src/deprecation.test.ts` › `DeprecatedConstantProxy with
child constant`, `it.skip` with the converged body and a `BLOCKED:
deprecated-constant-proxy-does-not-raise-on-a-missing-child-constant` line.

## Acceptance criteria

- [ ] A child-constant read that the target does not answer raises `NameError`,
      mirroring Ruby's constant lookup.
- [ ] The parked test runs unskipped and green with its converged body
      unchanged.
