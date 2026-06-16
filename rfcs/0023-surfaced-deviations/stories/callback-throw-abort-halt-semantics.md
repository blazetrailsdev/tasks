---
title: 'throw :abort halt semantics — converge throw "abort" vs return false'
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails halts a callback chain with `throw :abort`; the surrounding `destroy` /
`save` returns false (no exception). trails' default terminator
(`packages/activesupport/src/callbacks.ts` ~line 334:
`fn() === false`) halts only when a before-callback **returns `false`** — a
thrown value is NOT caught and propagates as an exception. There is no handler
that converts a thrown `"abort"` into a chain halt.

Yet many fixture models port Rails' `throw :abort` literally as
`throw "abort"`: `bird.ts:36`, `bulb.ts:60`, `cpk.ts:38`, `company.ts:324`,
`parrot.ts:36`, `ship.ts:24`, `pirate.ts:79`, `author.ts:260`. These are
latently non-functional: if such a callback ever fires on the destroy/save path,
it throws out of `destroy()` instead of halting and returning false. Surfaced in
PR #3469 — `ContentWhichRequiresTwoDestroyCalls` had to use `return false` (not
`throw "abort"`) to get a faithful first-pass abort. The `throw "abort"` sites
are currently unexercised (their conditions never true in tests), so nothing fails.

Rails ref: `ActiveSupport::Callbacks` terminator + `throw(:abort)` /
`Aborting`. `ActiveModel`'s `halted_callback_hook`.

## Acceptance criteria

- [ ] Decide convergence: either catch a thrown abort sentinel in the
      before-callback runner and treat it as a halt (Rails `throw :abort`
      semantics, returning false from destroy/save), OR ratify `return false`
      as the trails halt contract and convert all `throw "abort"` fixture-model
      callbacks to `return false`.
- [ ] Add a regression test: a `before_destroy` that aborts makes `destroy()`
      return false (not raise) and leaves the record persisted.
- [ ] Audit/convert the `throw "abort"` sites listed above per the chosen target.
- [ ] No test renamed; behavior matches Rails.
