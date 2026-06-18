---
title: "callback-abort-sentinel-control-flow"
status: done
updated: 2026-06-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: 3596
claim: "2026-06-18T18:00:40Z"
assignee: "callback-abort-sentinel-control-flow"
blocked-by: null
---

## Context

Follow-up to `callback-throw-abort-halt-semantics` (PR #3492), which ratified
`return false` as the trails callback-halt contract and converted all fixture
`throw "abort"` sites to `return false`. That convergence eliminated the
latently-broken thrown-string sites, but it locks in a deviation from modern
Rails:

- Modern Rails (5+) halts a callback chain **only** via `throw :abort`
  (Ruby catch/throw — non-local control flow, NOT `raise`). Returning `false`
  no longer halts; that was Rails ≤4 behavior, removed in Rails 5.
- trails' default terminator
  (`packages/activesupport/src/callbacks.ts` ~line 334:
  `fn() === false`) halts on a falsy **return** and never on a thrown sentinel.
  A thrown value propagates as an exception out of `destroy()`/`save()`.

So trails currently models cancellation the Rails ≤4 way (`return false`) while
Rails ≥5 fixtures/tests express it as `throw :abort`. The literal port of
`throw :abort` is `throw "abort"`, which in JS is just an exception — there is
no JS equivalent of Ruby catch/throw, so the port was non-functional and we
converged it away.

This story is the deliberate, uniform path to true Rails-5 fidelity: add a
real abort sentinel that the before-callback runner catches and treats as a
halt (returning false from the surrounding `destroy`/`save`, no exception),
**without** swallowing genuine errors. Decided in conversation on PR #3492:
we do NOT want a second ad-hoc thrown-string path bolted on next to
`return false`; we want one faithful mechanism modeled on Rails' catch/throw.

Key references:

- Rails: `activesupport/lib/active_support/callbacks.rb` — default terminator,
  `throw(:abort)` / `Aborting`. `activemodel/.../callbacks.rb` —
  `halted_callback_hook`. `activerecord/lib/active_record/callbacks.rb` —
  `destroy`/`save` returning false on a halted chain.
- trails terminator: `packages/activesupport/src/callbacks.ts` (`Before`
  class, `haltedLambda`, ~line 328-334).
- Existing single-contract sites that would adopt the sentinel:
  `collection-association.ts` `before_add`/`before_remove`; the fixtures
  converted in PR #3492 (`bird`, `bulb`, `cpk`, `cpk/book`, `company`,
  `parrot`, `ship`, `pirate`, `post`, `author`).

## Design constraints (from the PR #3492 discussion)

- Catching a **bare string** (`throw "abort"`) is an anti-pattern — it risks
  swallowing real errors. Use a dedicated, identity-checked abort sentinel
  (e.g. a unique symbol/object or a small `Abort` class), caught by identity,
  never by value-equality on a string.
- Genuine exceptions (Error subclasses, anything not the sentinel) MUST keep
  propagating out of `save`/`destroy` — this matches Rails, where `raise` in a
  callback aborts with the exception rather than silently halting.
- Prefer ONE mechanism. If the abort-sentinel path is added, decide whether
  `return false` remains a supported alias (Rails 5 ignores it) or is
  deprecated; document the choice. Do not leave two undocumented divergent
  paths.
- NO `node:*` imports, NO `process.*`, async fs only, no new third-party
  runtime deps. 500 LOC ceiling, single PR from main.

## Acceptance criteria

- [x] Add an abort sentinel + catch in the before-callback runner/terminator so
      a callback can halt the chain by throwing the sentinel (faithful to Rails
      `throw :abort`), causing `destroy`/`save` to return false with no
      exception escaping.
- [x] Non-sentinel exceptions still propagate unchanged (regression test: a
      beforeSave that throws a real Error aborts the save AND the error surfaces
      to the caller).
- [x] Regression test: a beforeDestroy that throws the abort sentinel makes
      destroy() return false (not raise) and leaves the record persisted.
- [x] Decide and document the relationship to the existing `return false`
      contract (keep as alias vs deprecate); update affected fixtures/tests
      consistently with that decision.
- [x] No test renamed; behavior matches Rails.
