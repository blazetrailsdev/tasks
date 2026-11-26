---
title: "parity:api:returns gates a block-returning method ported as void"
status: draft
updated: 2026-11-26
rfc: "0000-parity-gates-catch-semantic-drift"
cluster: parity-gates
packages: [scripts]
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

RFC Design §1. `with_lock` (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/locking/pessimistic.rb:92-99`)
returns its `transaction` block's value. The port returned `Promise<void>`
until trails#10792. `scripts/api-compare/report-void-returns.ts` is report-only
and finds a row only through a Rails caller that reads the value, and no Rails
file reads `with_lock`'s.

## Acceptance criteria

- [ ] `extract-ruby-api.rb` records `returnsBlock` for a method whose final statement is `yield`, or a call passing a block whose final statement is `yield`, or a call forwarding `&block`.
- [ ] `parity:api:returns --gate` reds a matched pair with `returnsBlock` whose TS signature returns `void` / `Promise<void>` (`extract-ts-api.ts#signatureReturnsVoid`), against an only-shrink per-package mark.
- [ ] Reverting trails#10792's `pessimistic.ts` change reds the gate; a fixture test proves it.
- [ ] Wired into `parity:changed` and CI; documented in `docs/parity-gates.md`.
