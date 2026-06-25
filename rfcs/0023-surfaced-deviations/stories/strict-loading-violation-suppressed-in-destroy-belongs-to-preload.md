---
title: "Destroy-callback belongs_to preload swallows StrictLoadingViolationError (should raise)"
status: ready
updated: 2026-06-25
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
---

## Context

Surfaced in PR #4107 (belongs-to-sync-read-direct-destroy-callback). To let a
sync `before_destroy`/`around_destroy` callback read an unloaded `belongs_to`,
`Base#_preloadBelongsToForDestroyCallbacks` (`base.ts`) materializes the
record's `belongs_to` targets before the destroy callback chain runs. The load
is best-effort: on any `loadTarget()` error the catch calls
`assoc.setTarget(null)` so the sync reader returns `null` instead of leaking an
async-reader Promise.

That swallow is intentionally broad — it covers an unregistered target class
and a missing FK row (needed so CPK destroy tests don't abort). But it ALSO
swallows a `StrictLoadingViolationError`: in Rails, reading a `strict_loading`
record's `belongs_to` inside a destroy callback raises, whereas trails now
silently resolves it to `null` and proceeds with the destroy. This is a Rails
deviation (strict-loading enforcement is suppressed on the destroy-callback
preload path).

trails refs:

- `packages/activerecord/src/base.ts` `_preloadBelongsToForDestroyCallbacks`
  (the `catch { assoc?.setTarget?.(null); }` branch).
  Rails refs:
- `vendor/rails/activerecord/lib/active_record/associations/association.rb`
  `load_target` → `raise StrictLoadingViolationError` when `owner.strict_loading?`.

No suite test currently exercises strict_loading + before_destroy reading a
belongs_to, so this is undetected by CI; needs a converging test plus a way to
distinguish "must-raise" (strict loading) from "swallow-and-null" (unregistered
class / missing row) errors in the preload catch.

## Acceptance criteria

- A `strict_loading` record whose `before_destroy` reads an unloaded
  `belongs_to` raises `StrictLoadingViolationError` on direct `destroy()`,
  matching Rails — the preload must not swallow strict-loading violations.
- Unregistered-target-class and missing-FK-row preload failures still resolve
  to `null` without aborting the destroy (no regression to CPK destroy tests).
- Converging test added (Rails-faithful name) covering the strict_loading case.
