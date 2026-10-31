---
title: "methodMissingProxy moves into the prototype chain, as the default Proxy shape"
status: draft
updated: 2026-10-31
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on `examples/twelve-dollar-server` profiles of 2026-10-30, after trails#9482 lifted the Relation Proxy into the prototype chain (`packages/activerecord/src/relation.ts`, see CLAUDE.md § "Ruby protocol methods with a different JS mechanism"). The file `packages/ruby-compat/src/method-missing-proxy.ts:164` wraps each instance in `new Proxy`, so every read of a defined member or field pays a trap. Its callers include `ReflectionProxy` (`packages/activerecord/src/associations/association-scope.ts:34`), `Delegator` (`packages/ruby-compat/src/delegate.ts:105`, `:202`), `CommandRecorder`, and rack's and rack-test's `UploadedFile`. On `/feed`, `method-missing-proxy.js` is 0.32% of self time and `delegate.js` 0.17%, before the deoptimised reads they cause elsewhere.

Writes are the trap in this pattern: a Proxy in the chain makes `[[Set]]` of a new property slow, which #9482 fixed with a private placeholder layer between the prototype and the Proxy (`_placeholderFields`), seated by the `set` trap.

## Acceptance criteria

- ruby-compat has one helper that splices a miss-only Proxy into a class's prototype chain, with the placeholder layer built in, and `Relation` uses it.
- `methodMissingProxy` callers convert to it, except a class whose trap must see hits.
- CLAUDE.md makes the prototype-chain shape the default for a Proxy row, stating the limits: `has` has no receiver, a trap cannot intercept a hit, and a chain Proxy needs the placeholder layer where instances write fields.
- Instances are not Proxies (`util.types.isProxy` is false, covered by a test), and only a missed name reaches the trap.
- Behaviour the Rails `method_missing` / `respond_to_missing?` gives is unchanged, including `rbObjRespondTo`. An `in` check cannot see a missed name; audit callers.
- CPU per request does not regress; a perf-only shape carries a `@perf` tag with the measurement.
