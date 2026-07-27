---
title: "Track: retire legacy Q-suffix predicate names"
status: ready
updated: 2026-07-27
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Track: retire legacy Q-suffix predicate names

## Context

Ruby `predicate?` ports as `is*` prefix with camel fallback
(docs/ruby-ts-conventions.md, from `rubyMethodToTs` in
`scripts/api-compare/conventions.ts:573`). A legacy trails invention encoded
the `?` as a literal `Q` suffix instead: `isConnectedQ`
(`packages/activerecord/src/connection-handling.ts:471`, with the alias
`isConnected = isConnectedQ` at line 479), `primaryClassQ`,
`applicationRecordClassQ`, `connectedToQ`, `activeConnectionsQ`, and about 30
distinct `*Q` symbols across `base.ts`, `inheritance.ts`,
`connection-adapters/abstract-adapter.ts`, `abstract/connection-handler.ts`,
`pool-config.ts`, `abstract/connection-descriptor.ts`,
`support/adapter-helper.ts`. Rails side: e.g. `connected?` in
`vendor/rails/activerecord/lib/active_record/connection_handling.rb`. `*Q`
names are never api:compare candidates, so each one is invisible extra surface
and leaves the Rails name unmatched.

Existing scattered stories (reference, do not re-home):
`rename-is-connected-q-onto-the-rails-connected-name` (0023, draft),
`converge-http-cache-predicates-onto-is-prefix` (0072, ready),
`ruby-method-to-ts-key-predicate-candidate` (0025, ready),
`converge-readonly-attribute-predicate-callers` (0072, done — precedent).

## Acceptance criteria

- Inventory of all exported `*Q` predicate symbols (grep
  `\b[a-z][a-zA-Z]+Q\s*[(=]` in `packages/*/src`, excluding tests).
- Each renamed onto its convention candidate (mechanical sweep; may split into
  per-package child stories under this RFC if over the LOC ceiling).
- A lint (or api-compare check) bans new exported `*Q` identifiers so the
  class stays fixed.
- Referenced scattered stories closed or completed via the sweep.
