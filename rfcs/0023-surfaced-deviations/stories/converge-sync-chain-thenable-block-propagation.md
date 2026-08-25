---
title: "Converge the sync-chain thenable-block throw between activesupport and the activemodel wrapper"
status: closed
updated: 2026-08-09
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
closed-reason: "Internal consistency between two trails-only guards; Ruby has no thenable so callbacks.rb offers no target to converge onto. Not a Rails-fidelity divergence."
---

## Context

`packages/activemodel/src/callbacks.ts:483` carries a standing note: activesupport's
`runAllCallbacks` (`packages/activesupport/src/callbacks.ts`, the `strict: "sync"`
paths around `:388`, `:405`, `:430`, `:508`) throws
`Async callback on sync chain "<name>" — block returned a Promise` when the
_block_ passed to a sync chain returns a thenable, but the activemodel wrapper
deliberately swallows that instead of propagating it. It survives on the
rails-error-parity grandfather list as a trails invention.

Surfaced while doing `sync-only-callback-registrar-types` (PR #5731), which
tightened the `afterInitialize` / `afterFind` registrars to reject
`Promise`-returning callbacks at compile time. That story explicitly scoped this
out: `:initialize` and `:find` are `only: :after` and pass no block, so the
block path is untouched by it. Every other sync-block caller is still unguarded.

Rails anchor: `vendor/rails/activesupport/lib/active_support/callbacks.rb`
(`run_callbacks` yields the block inline — Ruby has no thenable to detect, so the
question is what trails' invented guard should do rather than what Rails does).
Decide whether to propagate the throw (and remove the grandfather-list entry) or
delete the guard on the wrapper path entirely.

## Acceptance criteria

- [ ] Decide and implement one behavior for a thenable block on a
      `strict: "sync"` chain reaching the activemodel wrapper: either propagate
      the activesupport throw, or drop the inconsistent half so both layers agree.
- [ ] The chosen behavior is pinned by a test.
- [ ] The note at `packages/activemodel/src/callbacks.ts:483` is removed or
      rewritten to match reality.
- [ ] If the throw is propagated, the corresponding rails-error-parity
      grandfather-list entry is removed rather than left stale.
- [ ] `after_initialize` / `after_find` behavior is unchanged (no block, `only: :after`).
