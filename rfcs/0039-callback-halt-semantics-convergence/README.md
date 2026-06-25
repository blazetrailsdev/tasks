---
rfc: "0039-callback-halt-semantics-convergence"
title: "Callback-chain halt semantics convergence (throw :abort, drop return false)"
status: closed
created: 2026-06-21
updated: 2026-06-23
owner: "@deanmarano"
packages:
  - "activesupport"
  - "activerecord"
clusters: []
related-rfcs:
  - "0023-surfaced-deviations"
---

## Summary

Finish converging trails' callback-chain **halt** semantics onto modern Rails
(5+): halt only on the `throw :abort` sentinel, never on a `return false`. The
abort sentinel landed in `callback-abort-sentinel-control-flow` (PR #3596); the
residual convergence work (removing the `return false` alias, fixing the
fixture `throw "abort"` sites, and closing the after-callback-skip fidelity gap)
is gathered here from RFC 0023 so it has a single owner and rollout order.

## Motivation

Rails' default terminator halts a callback chain only on `throw :abort`; a
`false` return is ignored since Rails 5
(`vendor/rails/activesupport/lib/active_support/callbacks.rb`#default_terminator).
trails historically halted on `return false` and still keeps it as a documented
alias — two halt mechanisms where Rails has one. See
`[[project_rails_callback_halt_throw_abort_only]]` and
`[[feedback_deviation_stories_always_converge]]`: the project converges, never
ratifies, so the `return false` path must go.

Three tracked items remain:

- the `return false` halt alias in `activesupport/src/callbacks.ts` (+ the
  association before_add/before_remove paths) must be removed,
- fixture models port `throw :abort` as a literal `throw "abort"` that the
  terminator does not catch (latently non-functional),
- a fidelity gap where after-callbacks are not skipped when an around/block
  returns false (Rails `callbacks_test.rb:81-87`).

## Rollout

Sentinel-catch first (unblocks the fixtures), then drop the `return false`
alias, then the after-skip fidelity. All converge toward Rails; none ratify a
deviation.

- `callback-throw-abort-halt-semantics` (currently blocked) — make the
  terminator catch the `throw "abort"` sentinel and converge fixture sites.
- `deprecate-return-false-callback-halt-alias` — remove the `return false`
  halt alias now that the sentinel exists.
- `model-callbacks-block-false-after-skip-fidelity` — close the
  after-callback-skip gap (or document tracked-pending-convergence per the
  story's open question).
