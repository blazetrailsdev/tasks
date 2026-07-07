---
title: "Flip ActiveModel validation chain to async; drop strict-sync validate guard"
status: draft
updated: 2026-07-07
rfc: "0000-async-validation-chain"
cluster: null
deps: ["lint-guard-unawaited-isvalid"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

First half of the sync→async validation-chain flip (RFC
0000-async-validation-chain): make the ActiveModel chain async and drop the
activesupport guard that bars async validate callbacks.

- `packages/activemodel/src/validations.ts:121` — host interface
  `isValid(context?): boolean`; `runValidationsBang` at `:304`.
- `packages/activemodel/src/model.ts:1856` — `runValidationsBang()`
  wrapper; `:1899` caller.
- `packages/activesupport/src/callbacks.ts:455` and `:1008-1010` — the
  `strict: "sync"` validate-chain guard that throws on async validate
  callbacks ("Validations are synchronous; move async work to a
  beforeSave/afterSave callback."). The save chain already threads async
  halt decisions (`callbacks.ts:380-393`); validate should use the same
  path.

Rails anchors: `vendor/rails/activemodel/lib/active_model/validations.rb`
(`valid?`, `run_validations!`) — port the bodies, with `await` where the
callback chain runs.

Scope: activemodel + activesupport only, including their tests (await
sweep in AM test files rides here). Do NOT touch activerecord in this PR —
AR's `validations.ts` overrides `isValid` and is flipped by the follow-up
story `flip-activerecord-isvalid-async`. If AR fails typecheck against the
new AM signature, the two stories must merge as one PR instead — check
this early and note it in the PR.

## Acceptance criteria

- AM `isValid` / `validate` / `runValidationsBang` return
  `Promise<boolean>`; bodies mirror Rails `valid?`/`run_validations!`.
- The strict-sync validate guard in `callbacks.ts` is removed; an async
  validate callback runs and its halt decision is awaited (test proving
  it).
- AM validation tests pass with awaits added; no test renamed.
