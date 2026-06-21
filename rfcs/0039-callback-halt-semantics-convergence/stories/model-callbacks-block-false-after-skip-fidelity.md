---
title: "ModelCallbacks: after callbacks skipped when block returns false (Rails fidelity gap)"
status: in-progress
updated: 2026-06-21
rfc: "0039-callback-halt-semantics-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3770
claim: "2026-06-21T03:10:43Z"
assignee: "model-callbacks-block-false-after-skip-fidelity"
blocked-by: null
---

## Context

While converging `activemodel/src/callbacks.test.ts` to the abort sentinel
(PR #3700), I empirically confirmed a fidelity gap with Rails' canonical
`CallbacksTest` (`vendor/rails/activemodel/test/cases/callbacks_test.rb`).

Rails `ModelCallbacks` (lines 6-53) registers `around_create` (returns `false`
after yield), `after_create` (returns `false`), and a final `after_create`
(`:final_callback`). The test **"after callbacks are not executed if the block
returns false"** (`callbacks_test.rb:81-87`) runs `create` with `valid: false`
(so the run-callbacks block returns `false`) and asserts:

```ruby
[:before_create, :before_around_create, :create, :after_around_create]
```

i.e. `after_create` and `:final_callback` are **skipped**.

trails does NOT reproduce this. A faithful port (around returns false + block
returns false, on `defineModelCallbacks(:create)` which sets
`skipAfterCallbacksIfTerminated: true`) runs ALL callbacks — `after_create` and
`final_callback` both fire (verified with a scratch test against
`packages/activesupport/src/callbacks.ts` `_invoke`). Reason: after PR #3700 the
default terminator only halts on the abort sentinel; a block/around returning
`false` never sets `env.halted`, so `After#call`'s `(!halted || !halting)` guard
(`vendor/.../callbacks.rb:206`) lets after callbacks run.

Because of this gap, the trails port of that test was implemented with a
`beforeValidation` halt rather than the Rails block-return mechanism; in PR #3700
its body was converted to `throwAbort()` — so the test named "...if the block
returns false" no longer exercises a `false` block return at all. The Rails name
is kept (test:compare match) but the assertion is now satisfied via the sentinel,
not the mechanism the name describes.

Open question to resolve during this story: determine the EXACT Rails mechanism
that skips after callbacks here (block/around return value vs `env.halted` vs an
ActiveModel-specific terminator), then either (a) make the trails engine match
Rails so the faithful port passes, or (b) document a tracked-pending-convergence
deviation if Rails' behavior is genuinely throw-only and the vendor test relies
on legacy semantics.

Key files:

- `packages/activesupport/src/callbacks.ts` `_invoke` (sync + async before
  phase; `env.halted` is set only via the abort sentinel).
- `packages/activemodel/src/callbacks.test.ts` "after callbacks are not executed
  if the block returns false" (currently throwAbort-based).
- Rails: `vendor/rails/activemodel/test/cases/callbacks_test.rb:6-87`,
  `vendor/rails/activesupport/lib/active_support/callbacks.rb:100-216`.

## Acceptance criteria

- [x] Pin down Rails' actual halt mechanism for "after callbacks not executed
      when the block returns false" (cite callbacks.rb lines).
- [x] Either converge the trails engine so a faithful port (around/block return
      false, no throwAbort) reproduces Rails' skip, OR document the deviation as
      tracked-pending-convergence with a clear rationale.
- [x] Rewrite the trails test to faithfully mirror Rails `ModelCallbacks`
      (block-return mechanism), without renaming it; test:compare match preserved.
- [x] No regression in the abort-sentinel halting behavior from PR #3700.
