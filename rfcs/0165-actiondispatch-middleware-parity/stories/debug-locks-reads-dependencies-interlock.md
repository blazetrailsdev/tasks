---
title: "debug-locks-reads-dependencies-interlock"
status: draft
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::DebugLocks#render_details` reads
`ActiveSupport::Dependencies.interlock.raw_state`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_locks.rb:50`).
`interlock` is `singleton_class.attr_accessor :interlock` on
`ActiveSupport::Dependencies`, seeded with `Interlock.new`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/dependencies.rb:9-10`), and
`Interlock#raw_state` forwards to `ActiveSupport::Concurrency::ShareLock#raw_state`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/dependencies/interlock.rb:45-47`).

Neither `dependencies.rb`'s `interlock`, `Dependencies::Interlock`, nor
`Concurrency::ShareLock` is ported, so trails keeps a static
`DebugLocks.interlock` slot on
`packages/actionpack/src/action-dispatch/middleware/debug-locks.ts`, which
`parity:api:extra` scores as moved and which carries a CONVERGEABLE receipt
pointing here. Its `throw` when the slot is unset is an invented arm too.

## Acceptance criteria

- `ActiveSupport::Dependencies` is seated in activesupport with an `interlock`
  accessor holding a ported `Dependencies::Interlock`, backed by a ported
  `Concurrency::ShareLock#raw_state`.
- `DebugLocks#renderDetails` reads `Dependencies.interlock.rawState(...)` as
  Rails does; the static `DebugLocks.interlock` slot, its receipt and the
  unset-slot `throw` are deleted.
- `parity:api:extra --package actiondispatch` no longer lists
  `middleware/debug-locks.ts`.
