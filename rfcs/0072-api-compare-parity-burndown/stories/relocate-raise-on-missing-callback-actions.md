---
title: "Declare raise_on_missing_callback_actions in its Rails-layout file"
status: closed
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: missing-methods
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: data layer only (arel/activemodel/activerecord); this is actionpack/trailties surface"
---

## Context

`parity:api` reports 2 missing methods for `abstractcontroller` `callbacks.rb`
(`output/api-comparison.json`, package at 87/102):

- `raise_on_missing_callback_actions`
- `raise_on_missing_callback_actions=`

Both are declared by Rails in
`vendor/rails/actionpack/lib/abstract_controller/callbacks.rb` (the
`mattr_accessor` near the top of `AbstractController::Callbacks`), but trails
declares the slot in `packages/actionpack/src/abstract-controller/base.ts`
(`static raiseOnMissingCallbackActions: boolean = false`). That single
misplacement costs twice: the name reads as MISSING on `callbacks.ts` and as
MOVED extra surface on `base.ts` (one of base.ts's four moved entries in
`pnpm parity:api:extra`).

## Acceptance criteria

- The accessor is declared in `callbacks.ts` (its Rails-layout home) and
  installed onto `AbstractController` from there, per the CLAUDE.md
  module-mixin pattern.
- `ActionFilter#isMatch` and every existing reader of the flag keep working;
  existing tests pass unchanged.
- `parity:api` shows `callbacks.rb` at 11/11 for this pair, and `parity:api:extra`
  no longer lists `raiseOnMissingCallbackActions` as moved surface on `base.ts`.
