---
title: "activemodel: Dirty#init_attributes takes Rails' one argument (arity 451/452)"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: api-surface
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports activemodel **arity 451/452**; the one mismatch is
`Dirty#init_attributes(other)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/dirty.rb:253`) ported as
`initAttributes(super_, other)` (`packages/activemodel/src/dirty.ts:162`). The leading `super_` is the
object-literal `prepend` shape — the port threads the next method in the chain as a parameter
instead of calling `super`. `scripts/api-compare/arity-exclude.json` is empty, so this is unreceipted
drift, and it also shifts every parameter name (the params gate only escapes because the extractor
aligns from the right).

## Acceptance criteria

- [ ] `initAttributes` takes `(other)` and reaches the next implementation through the class-module `include()`/`prepend()` super chain CLAUDE.md § "Module mixins" settles.
- [ ] `pnpm parity:api` activemodel arity **452/452**; `pnpm parity:api:params` green.
- [ ] `packages/activemodel/src/dirty.test.ts` green, and the AR `dirty.test.ts` suites that reach it green on SQLite.
