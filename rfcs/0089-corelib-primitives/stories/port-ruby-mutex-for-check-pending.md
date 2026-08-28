---
title: "Port Ruby's Mutex so CheckPending stops standing Monitor in for it"
status: draft
updated: 2026-08-28
rfc: "0089-corelib-primitives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration::CheckPending` holds `@mutex = Mutex.new`
(`vendor/rails/activerecord/lib/active_record/migration.rb:651`) — Ruby's core,
NON-reentrant `Mutex`. trails has no `Mutex` port, so PR #7166 stood
`ActiveSupport::Concurrency::Monitor`
(`packages/activesupport/src/concurrency/monitor.ts:121`) in for it, justified
in `CheckPending`'s class JSDoc (`packages/activerecord/src/migration.ts`).

`Monitor` is the wrong class on two counts, and only the second is currently
harmless:

1. It is trails' port of Ruby stdlib's `MonitorMixin`, the thing Rails classes
   pick up with `include MonitorMixin` (`pool_config.rb:6`,
   `ActiveSupport::Concurrency::LoadInterlockAwareMonitor`). `CheckPending`
   does neither — a Rails reader sees `Mutex.new` and trails names a monitor.
2. It is REENTRANT where `Mutex` deadlocks. `CheckPending#call` is the sole
   caller and never re-enters, so the two agree on every path this class has
   today; a future re-entering caller would silently diverge instead of
   deadlocking as Rails does.

Other `Mutex`-guarded Rails code in the port sidesteps the class entirely
(`packages/activesupport/src/deprecation.ts:193`,
`packages/activerecord/src/future-result.ts:157`), so this is the first site
that actually needs the name.

## Converged shape

Port Ruby's core `Mutex` next to the other corelib primitives, with
`synchronize` taking an async block the way `Monitor`'s does (the genuine TS
shortcoming — Ruby's is sync), and non-reentrant semantics: a re-entering
`synchronize` is an error, not a pass-through. `CheckPending` then holds
`new Mutex()` and reads as `migration.rb:651` does, and the JSDoc paragraph
justifying the stand-in is deleted.

## Acceptance criteria

- A `Mutex` port exists with Rails' name, `synchronize` accepting an async
  block, and non-reentrant semantics.
- `CheckPending` holds `new Mutex()`; the `Monitor` stand-in and the JSDoc
  paragraph justifying it are gone.
- `Monitor` keeps its existing `MonitorMixin` callers untouched — this story
  adds a sibling primitive, it does not re-point them.
- `packages/activerecord/src/migration/pending-migrations.test.ts` and
  `migration.test.ts` stay green.
