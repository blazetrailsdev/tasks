---
title: "Converge Initializable#initializers_chain onto respond_to?(:initializers)"
status: draft
updated: 2026-09-22
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

Surfaced by `pnpm parity:api:duck-types` (trails#7979), hand-audited real.
`vendor/rails/railties/lib/rails/initializable.rb:78`: `next unless klass.respond_to?(:initializers)` over `ancestors.reverse`.
`packages/trailties/src/initializable.ts:120-128` (`initializersChain`) tests `klass === Initializable || klass.prototype instanceof Initializable`,
so a module mixed in with `include()` that defines `initializers` without inheriting `Initializable` is skipped.

## Acceptance criteria

- The loop guard is `rbObjRespondTo(klass, "initializers")`, and the `instanceof` is gone.
- Its row drops out of `pnpm parity:api:duck-types`.
