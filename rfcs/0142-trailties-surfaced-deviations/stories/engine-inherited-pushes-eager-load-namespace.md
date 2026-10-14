---
title: "trailties: Engine.inherited's eager_load_namespaces << base is not in Engine.register"
status: draft
updated: 2026-10-14
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Engine.inherited` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:361-373`)
does two things for a non-abstract engine: it pushes the subclass onto
`Rails::Railtie::Configuration.eager_load_namespaces`, then it seats
`called_from`. trails defers that hook into `Engine.register`
(`packages/trailties/src/engine.ts:72-77`), which ports the `called_from` arm
and drops the `eager_load_namespaces << base` arm. The finisher's eager-load
pass reads `config.eagerLoadNamespaces` (`packages/trailties/src/application/finisher.ts:113`),
so a registered engine is never eager-loaded. Found by the RFC 0188 inherited-hooks
audit (trails#8887, `docs/infrastructure/inherited-hooks-inlined-from-audit.md` row 26).

## Acceptance criteria

- `Engine.register` pushes `base` onto the eager-load namespaces before it seats
  `calledFrom`, under the same `unless base.abstract_railtie?` guard, in Rails' order.
- The list is the class-level `Railtie::Configuration` one Rails names, not a per-instance copy.
- A test shows that an engine subclass's namespace is in `eagerLoadNamespaces` after registration.
