---
title: "OrderedOptions' Proxy moves into the prototype chain"
status: draft
updated: 2026-10-31
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on `examples/twelve-dollar-server` profiles of 2026-10-30, after trails#9482 lifted the Relation Proxy into the prototype chain (`packages/activerecord/src/relation.ts`, see CLAUDE.md § "Ruby protocol methods with a different JS mechanism"). `OrderedOptions` (`packages/activesupport/src/ordered-options.ts:18`) has `get`, `set` and `has` traps and is 0.69-0.81% of self time, from config reads per request. Rails: `active_support/ordered_options.rb`. This is the least certain candidate: its `has` answers every name and writes define keys, so test first whether a chain Proxy is possible and whether keys can be data properties.

## Acceptance criteria

- Either convert it, or close the story `FALSIFIED:` with the reason.
- Instances are not Proxies (`util.types.isProxy` is false, covered by a test), and only a missed name reaches the trap.
- Behaviour the Rails `method_missing` / `respond_to_missing?` gives is unchanged, including `rbObjRespondTo`. An `in` check cannot see a missed name; audit callers.
- CPU per request does not regress; a perf-only shape carries a `@perf` tag with the measurement.
