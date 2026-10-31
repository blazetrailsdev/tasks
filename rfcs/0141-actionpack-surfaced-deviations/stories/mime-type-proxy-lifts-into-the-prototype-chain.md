---
title: "MimeType's Proxy moves into the prototype chain"
status: draft
updated: 2026-10-31
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on `examples/twelve-dollar-server` profiles of 2026-10-30, after trails#9482 lifted the Relation Proxy into the prototype chain (`packages/activerecord/src/relation.ts`, see CLAUDE.md § "Ruby protocol methods with a different JS mechanism"). `MimeType` and `NullType` return `new Proxy(this, METHOD_MISSING_HANDLER)` (`packages/actionpack/src/action-dispatch/http/mime-type.ts:222`, `:432`), and its handler's first act is `Reflect.has`, so hits pay the trap. `mime-type.js` is 0.52% of self time on both `/feed` and `/posts`. Rails: `action_dispatch/http/mime_type.rb:336-346`, `:379-385`.

## Acceptance criteria

- Instances are not Proxies (`util.types.isProxy` is false, covered by a test), and only a missed name reaches the trap.
- Behaviour the Rails `method_missing` / `respond_to_missing?` gives is unchanged, including `rbObjRespondTo`. An `in` check cannot see a missed name; audit callers.
- CPU per request does not regress; a perf-only shape carries a `@perf` tag with the measurement.
