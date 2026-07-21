---
title: 'strict:"sync" callback guards throw bare Error, blocking rails-error-parity burndown'
status: draft
updated: 2026-07-21
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced in #5015 (runCallbacks returns the block value).

`packages/activesupport/src/callbacks.ts` throws bare `new Error(...)` for its
`strict: "sync"` guards — "Async block on chain with no callbacks" and
"Async callback on sync chain ... returned a Promise". These are trails
inventions with no Rails counterpart: Rails' `run_callbacks` has no strict-sync
mode, because Ruby callbacks are synchronous by construction.

They survive `blazetrails/rails-error-parity` only because
`packages/activesupport/src/callbacks.ts` sits on the grandfather list at
`eslint/rails-error-parity-exclude.json:123`.

This became visible while addressing review comment 3 on #5015. The activemodel
sibling `runAllCallbacks` (`packages/activemodel/src/callbacks.ts:479-487`) has
a structurally identical empty-chain branch but NO strict-sync guard. Adding
one there failed lint, because that file is not grandfathered — and adding it
to the exclude list would ratchet the burndown backwards. The asymmetry was
therefore documented in place rather than propagated, deliberately leaving the
two branches inconsistent.

## Acceptance criteria

- [ ] Decide whether the strict-sync guard is a keeper. Trails callbacks are
      async-capable where Rails' are not, so the guard has real value — but it
      needs a ported error class, not the bare global `Error`.
- [ ] If keeping: give the guards a proper error class so
      `packages/activesupport/src/callbacks.ts` can come OFF
      `eslint/rails-error-parity-exclude.json`, then propagate the guard to
      activemodel's `runAllCallbacks` empty-chain branch and drop the
      explanatory NOTE comment added by #5015.
- [ ] If dropping: remove the guards and the exclude-list entry.
- [ ] Either way the two empty-chain branches end up consistent, and the
      exclude-list entry for callbacks.ts is gone.
