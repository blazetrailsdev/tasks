---
title: "BodyProxy's Proxy moves into the prototype chain"
status: draft
updated: 2026-10-31
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on `examples/twelve-dollar-server` profiles of 2026-10-30, after trails#9482 lifted the Relation Proxy into the prototype chain (`packages/activerecord/src/relation.ts`, see CLAUDE.md § "Ruby protocol methods with a different JS mechanism"). `BodyProxy` (`packages/rack/src/body-proxy.ts:11`) is built for each response and is 0.50-0.55% of self time. Its Rails-side counterpart is rack's `lib/rack/body_proxy.rb` `method_missing`.

## Acceptance criteria

- If the prototype-chain helper from `method-missing-proxy-lifts-into-the-prototype-chain` exists, use it.
- Instances are not Proxies (`util.types.isProxy` is false, covered by a test), and only a missed name reaches the trap.
- Behaviour the Rails `method_missing` / `respond_to_missing?` gives is unchanged, including `rbObjRespondTo`. An `in` check cannot see a missed name; audit callers.
- CPU per request does not regress; a perf-only shape carries a `@perf` tag with the measurement.
