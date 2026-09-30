---
title: "call-args gate: a receiverless Ruby self-reader steals a TS send to a local (arel crud.rb offset)"
status: done
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: receipts
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8302
claim: "2026-09-30T19:33:24Z"
assignee: "arel-copy-hooks-onto-rbobjclone-initialize-copy"
blocked-by: null
closed-reason: null
---

## Context

Split out of `arel-audit-permanent-receipts-against-claude-md`.
`packages/arel/src/crud.ts:38,59` carry `@missingRailsArgs offset` receipts on
`compileUpdate` / `compileDelete`, but both bodies are line-for-line
`vendor/rails/v8.0.2/activerecord/lib/arel/crud.rb:17-45`: Ruby
`um.offset(offset)` is TS `um.offset(this.offset)`.

The row is a pairing artifact of the call-argument gate. Ruby's call stream for
`compile_update` (`output/rails-api.json`) holds two `offset` sites: the outer
`um.offset(offset)` (`recv: id:um`, flagged `weak` because `um` is a plain local)
and the inner receiverless zero-arg `offset` self-reader. TS has only
`um.offset(this.offset)`, because the self-reader is a getter, not a call.
`comparableRubySites` (`scripts/api-compare/call-args.ts`) drops the weak outer
site (crud.rb declares no `offset`), so `pairCallSites` pairs the inner
self-reader (args `[]`) with the TS writer send (args `[ref:offset]`) and reports
a shape row. Removing both receipts reds `pnpm parity:api:calls:args` with
`+ arel crud.ts compile_update offset()` / `compile_delete offset()`.

A candidate fix (not applied): skip the pairing candidate when the Ruby site is
receiverless with no arguments and the TS site passes arguments to an `id:` local
receiver. Measure how many previously compared sites it drops before landing it.

## Acceptance criteria

- [ ] The call-argument gate no longer pairs a receiverless zero-arg Ruby
      self-reader against a TS send to a local, with a
      `scripts/api-compare/call-args.test.ts` case built from `crud.rb`'s shape.
- [ ] Both `crud.ts` receipts are deleted and `pnpm parity:api:calls:args` stays
      green, with no baseline row added.
