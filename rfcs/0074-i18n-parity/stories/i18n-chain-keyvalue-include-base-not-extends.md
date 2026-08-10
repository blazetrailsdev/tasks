---
title: "Backend::Chain and Backend::KeyValue include Base rather than extending it"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6058
claim: "2026-08-04T13:42:10Z"
assignee: "i18n-chain-keyvalue-include-base-not-extends"
blocked-by: null
closed-reason: null
---

## Context

`I18n::Backend::Chain` (`vendor/i18n/lib/i18n/backend/chain.rb:21-23,127`) and
`I18n::Backend::KeyValue` (`vendor/i18n/lib/i18n/backend/key_value.rb:69-73,201`)
have the same shape `Backend::Simple` did before PR #6054: a class with **no**
superclass whose bodies live in an `Implementation` module that
`include Base` (`include Base, Flatten` for `KeyValue`), included back into the
class. `packages/i18n/src/backend/chain.ts:60` and
`packages/i18n/src/backend/key-value.ts:99` both port that as
`class X extends Base`, which collapses the mixin seam exactly as
`Simple extends Base` did.

## Acceptance criteria

- `Chain` and `KeyValue` declare no TS superclass; `include Base` is spelled as
  in `packages/i18n/src/backend/simple.ts` after #6054 — a declaration-merged
  `interface X extends Base {}` plus the prototype copy at the bottom of the
  file (class body wins, as Ruby's `include` does), with any `super` call
  becoming `Base.prototype.<m>.call(this)`.
- `KeyValue` also includes `Flatten` (`key_value.rb:73`); keep that arm.
- `pnpm parity:api` i18n inheritance does not regress (currently 6/6 — these
  two are not scored today, so the win is the seam, not the number).
- `backend/chain.test.ts` and `backend/key-value.test.ts` stay green.
