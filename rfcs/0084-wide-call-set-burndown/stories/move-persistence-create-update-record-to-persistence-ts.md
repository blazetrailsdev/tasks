---
title: "Move the Persistence layer of the create/update chain into persistence.ts"
status: claimed
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: "2026-08-12T15:36:57Z"
assignee: "call-args-ar-connection-adapters-blocks"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Persistence#_create_record` and `#_update_record`
(`vendor/rails/activerecord/lib/active_record/persistence.rb:900-916` and
`:918-942`) are the bottom of the create/update super chain: the UPDATE /
INSERT, `@new_record = false` / `@previously_new_record`, and the `yield(self)`
that `save(&block)` rides on.

PR #6412 layered that chain onto Rails' module structure
(`Timestamp → Callbacks → Dirty → CounterCache → Persistence`, per
`base.rb:299-316`), but had to leave the Persistence layer itself where trails
already had it: two module-private helpers in `callbacks.ts`
(`persistenceCreateRecord` / `persistenceUpdateRecord`), which in turn call
`base.ts`' `private _performInsert()` / `_performUpdate()` for the actual SQL.

So the file layout still diverges from Rails in two ways:

- The Persistence layer of the chain lives in `callbacks.ts`, not
  `persistence.ts`, under names (`persistenceCreateRecord`,
  `persistenceUpdateRecord`) that exist in no Ruby file. A Rails dev reading
  `persistence.rb:920-940` and then `persistence.ts` does not find the INSERT
  body there.
- `_performInsert` / `_performUpdate` are trails-only decompositions of those
  two Rails methods; Rails inlines the work (`_insert_record` /
  `_update_row` are the only extractions it makes).

`persistence.ts` already exports an `_updateRecord` (the class-level
`ClassMethods#_update_record`, `persistence.rb:~600`), so the instance-side
names are free but the file needs care about which is which.

## Converged shape

Move the two bodies to `persistence.ts` as the instance-side
`_createRecord` / `_updateRecord`, taking the same `block` continuation
PR #6412 threads today, and have `callbacks.ts` call those instead of its
local helpers. Fold `_performInsert` / `_performUpdate` into them as far as
`base.ts`' private state (`_pendingOperation`, `_attributes`,
`_dirty.reinstateNewRecordChanges`) allows, keeping `_insert_record` and
`_update_row` as the only extractions, per `persistence.rb:920-940`.

Note the `_pendingOperation` await and the
`reinstateNewRecordChanges` call are trails-specific bookkeeping with no Rails
counterpart — carry them across unchanged rather than redesigning them here,
and file separately if they turn out to be removable.

## Acceptance criteria

1. `callbacks.ts` defines no `persistenceCreateRecord` /
   `persistenceUpdateRecord`; the Persistence layer is reached in
   `persistence.ts` at the Rails names.
2. The chain order and the `save(&block)` yield point are unchanged — the
   yield stays after the INSERT and `@new_record = false`, before the
   after_create callbacks (`persistence.rb:936-940`), with
   `persistence-save-block.trails.test.ts` green.
3. `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; no new
   baseline rows, and any row that converges is deleted by hand.
4. `pnpm parity:api:extra --package activerecord` does not grow.
5. Persistence, callbacks, timestamp, dirty, counter-cache, locking and
   autosave suites stay green.
