---
title: "Converge the _create_record/_update_record super chain onto Rails' module layering"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: 6412
claim: "2026-08-12T13:26:03Z"
assignee: "call-args-ar-extra-argument-rest-3"
blocked-by: null
closed-reason: null
---

## Context

Rails builds the create/update write path out of one method per concern, each
calling `super`, layered by `include` order in `base.rb`:

- `Timestamp#_create_record` / `#_update_record` / `#create_or_update(touch:)`
  (`vendor/rails/activerecord/lib/active_record/timestamp.rb:107-127`)
- `AttributeMethods::Dirty#_create_record` / `#_update_record` — `super` then
  `changes_applied` (`attribute_methods/dirty.rb:233-243`)
- `CounterCache#_create_record` — `id = super` then the counter increments
  (`counter_cache.rb:200-207`)
- `Callbacks#_create_record` — `_run_create_callbacks { super }`
  (`callbacks.rb:444-448`)
- `Persistence#_create_record` — the INSERT, `@new_record = false`, the yield
  (`persistence.rb:920-940`)

trails flattens all of it into one body, `callbacks.ts#_createRecord`
(plus `base.ts#_performInsert`): the timestamp writes, the dirty
`changesApplied()`, the counter-cache call and the INSERT all live inline in
that single function.

The consequence is dead parity surface. `timestamp.ts` exports
`createOrUpdate`, `_createRecord` and `_updateRecord`, but none of the three is
in `InstanceMethods` (`timestamp.ts:533`) and nothing imports them — verified
with a repo-wide grep for `Timestamp.createOrUpdate` / `Timestamp._createRecord`
/ `Timestamp._updateRecord` (no hits) and for `base.ts`'s prototype wiring,
which installs `callbacks.ts`' versions instead (`base.ts:5103-5115`). Their own
bodies admit it: _"Rails calls super here (the persistence layer). In trails the
persistence layer is wired separately via callbacks.ts; this method provides the
timestamp-writing half only."_ `attribute-methods.ts:1006-1017`'s
`_updateRecord`/`_createRecord` are the same kind of shim, delegating to the
persistence functions rather than sitting in a super chain.

So these methods score for `parity:api` while being unreachable — a Rails dev
reading `timestamp.rb` and then `timestamp.ts` finds a method that looks wired
and is not. Surfaced by review on #6405 (twice: _"still dead code, pre-existing,
unrelated to this PR"_), which threaded `save`'s block through this stack and
had to route it past the flattened body rather than through the layers.

## Converged shape

Each Rails module keeps its own `_create_record` / `_update_record` taking the
next layer as an explicit `super` continuation — the shape
`counter-cache.ts#_createRecord(superFn)` already uses successfully and which
`callbacks.ts#_createRecord` already calls. Extend that to the timestamp and
dirty layers so the chain is
`Callbacks → CounterCache → Dirty → Timestamp → Persistence`, matching
`base.rb`'s include order, with each body reduced to its own concern:

- `timestamp.ts#_createRecord(superFn)` writes the create timestamps, then
  `return superFn()`.
- `timestamp.ts#_updateRecord(superFn)` wraps `superFn` in
  `recordUpdateTimestamps` (Rails' `record_update_timestamps { super }`).
- `attribute-methods.ts` (Dirty) `_createRecord(superFn)` / `_updateRecord(superFn)`
  call `superFn()` then `changesApplied()`, deleting the inline
  `this.changesApplied()` from `callbacks.ts`.
- `timestamp.ts#createOrUpdate(touch, block)` gets wired ahead of
  `callbacks.ts#createOrUpdate` so `_touchRecord` is set by the Rails layer
  rather than by `save`'s `_skipTouch` flag.

The inline timestamp block in `base.ts#_performInsert` and the
`wroteTimestamps` / `skipInnerTouch` bookkeeping in `callbacks.ts#_updateRecord`
come out as the layers take over — that bookkeeping exists only because two
layers currently both try to write timestamps.

## Acceptance criteria

1. `timestamp.ts`'s `createOrUpdate`, `_createRecord`, `_updateRecord` are on
   the runtime chain (or deleted if the layer genuinely has nothing to do); no
   exported method in that file is unreachable.
2. `changes_applied` moves to the Dirty layer, per `dirty.rb:233-243`.
3. The `skipInnerTouch` / `wroteTimestamps` double-write guards in
   `callbacks.ts#_updateRecord` are gone, not merely relocated.
4. The `save(&block)` yield point stays where #6405 put it — after the INSERT
   and `@new_record = false`, before the after_create callbacks
   (`persistence.rb:936-940`) — with
   `persistence-save-block.trails.test.ts` still green.
5. Timestamp, counter-cache, dirty and autosave suites stay green; no new
   baseline rows.
