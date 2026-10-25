---
title: "Call-order check counts an option property read (opts.all) as a call"
status: draft
updated: 2026-10-25
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The call-order check (`reorderedCalls`, `scripts/api-compare/compare.ts:1162-1240`) counts a TS property read as a call when the property has the same name as a ported method. In `packages/raabro/src/raabro.ts`, `ModuleMethods#parse` (mirroring `vendor/raabro/v1.4.0/lib/raabro.rb` `parse`) reads the option `opts.all`. The TS sequence then records `all` before `Input.new`, which produces the row `order:all,constructor → constructor,all`. Rails' sequence has `new` first, and its `opts[:all]` is a hash read, not a call. trails#9307 got around this by writing `opts["all"]` in bracket form.

## Acceptance criteria

- [ ] `collectCalls` in `extract-ts-api.ts` records no call position for a plain property read (not a call expression) on an options object.
- [ ] `raabro.ts` `parse` goes back to `opts.all` and `pnpm parity:api:calls` stays green.
