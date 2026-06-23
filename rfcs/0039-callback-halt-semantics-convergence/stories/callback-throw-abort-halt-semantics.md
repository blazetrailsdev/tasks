---
title: 'throw :abort halt semantics — converge throw "abort" vs return false'
status: done
updated: 2026-06-23
rfc: "0039-callback-halt-semantics-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 10
pr: 3596
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

Yet many fixture models port Rails' `throw :abort` literally as `throw "abort"`
(paths under `packages/activerecord/src/test-helpers/models/`):
`bird.ts:36`, `bulb.ts:68`, `cpk.ts:38`, `cpk/book.ts:25`, `company.ts:324`,
`parrot.ts:36`, `ship.ts:24`, `pirate.ts:79`, `post.ts:564`,
`author.ts:260` and `author.ts:266`. These are
latently non-functional: if such a callback ever fires on the destroy/save path,
it throws out of `destroy()` instead of halting and returning false. Surfaced in
PR #3469 — `ContentWhichRequiresTwoDestroyCalls` had to use `return false` (not
`throw "abort"`) to get a faithful first-pass abort. The `throw "abort"` sites
are currently unexercised (their conditions never true in tests), so nothing fails.

Precedent for the convergence target: trails' collection-association callbacks
already model Rails' `throw :abort` as a callback **returning `false`** —
`packages/activerecord/src/associations/collection-association.ts:693` (`removeRecords`,
Rails `catch(:abort) { before_remove }`) and `:932` (`before_add`) both halt on
`!callback(...)` returning false, never on a thrown sentinel. Converging the
fixture models on `return false` matches this existing contract.

Rails ref: `activesupport/lib/active_support/callbacks.rb` — the default
terminator and `throw(:abort)` / `Aborting`. `ActiveModel`'s
`halted_callback_hook` (`activemodel/lib/active_model/callbacks.rb`).
Persistence halt: `activerecord/lib/active_record/callbacks.rb`
(`destroy`/`save` returning false on a halted chain).

## Acceptance criteria

- [ ] Decide convergence: either catch a thrown abort sentinel in the
      before-callback runner and treat it as a halt (Rails `throw :abort`
      semantics, returning false from destroy/save), OR ratify `return false`
      as the trails halt contract and convert all `throw "abort"` fixture-model
      callbacks to `return false`.
- [ ] Add a regression test: a `before_destroy` that aborts makes `destroy()`
      return false (not raise) and leaves the record persisted.
- [ ] Audit/convert all `throw "abort"` sites listed above per the chosen
      target. Note the collection-association precedent already uses
      `return false`, which favors ratifying that as the halt contract.
- [ ] No test renamed; behavior matches Rails.
