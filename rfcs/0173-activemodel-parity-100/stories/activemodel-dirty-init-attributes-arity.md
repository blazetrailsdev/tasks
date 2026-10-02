---
title: "activemodel: Dirty#init_attributes takes Rails' one argument (arity 451/452)"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: api-surface
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8368
claim: "2026-10-02T00:39:41Z"
assignee: "activemodel-dirty-init-attributes-arity"
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

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
