---
title: "trails has no load_schema! super chain, so CounterCache and EncryptableRecord's hooks hang off the wrong seam (or none)"
status: ready
updated: 2026-08-21
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds `load_schema!` as a super chain: `ModelSchema#load_schema!`
(`activerecord/lib/active_record/model_schema.rb:565`) is the anchor, and each
concern that needs schema-time bookkeeping overrides it and calls `super` —
`CounterCache::ClassMethods#load_schema!` (`counter_cache.rb:186-195`),
`Encryption::EncryptableRecord::ClassMethods#load_schema!`
(`encryption/encryptable_record.rb:139-142`), `AttributeMethods`, `Attributes`,
and others.

trails has no such chain. `model-schema.ts:1628`'s private `loadSchemaBang`
just calls `loadSchema.call(this)` and dispatches to nothing else, so the
concern-level hooks are unreachable:

- `packages/activerecord/src/counter-cache.ts` — `loadSchemaBang` was exported
  with **zero callers** until PR #6782, which hung it off
  `flushPendingCounterCacheColumns` (reached from `registerModel` in
  `associations.ts:402` and from the belongs_to builder) so that
  `counter_cache.rb:186-195` would actually run. That is the wrong seam: it
  fires at model-registration time, not schema-load time.
- `packages/activerecord/src/encryption/encryptable-record.ts:324` —
  `static loadSchemaBang(modelClass)` has **zero callers** today, so
  `encryptable_record.rb:139-142`'s `validate_column_size` pass never runs.

Each concern also has to re-derive "am I being called at the right time"
locally, and a new concern that needs a `load_schema!` override has nowhere to
put it.

## Converged shape

Model `load_schema!` as a chain the way the rest of the port models Ruby
`super` over a mixin (see `include()` / `Included<>` in
`packages/activesupport/src/include.ts`, and the `superFn` parameter idiom
already used by `CounterCache._createRecord` / `destroyRow` in
`counter-cache.ts`). `model-schema.ts`'s `loadSchemaBang` becomes the base of
the chain; CounterCache and EncryptableRecord register their overrides onto it
rather than being called from an unrelated seam.

Then:

- `flushPendingCounterCacheColumns` stops calling `loadSchemaBang` and goes
  back to being only the pending-column flush (or disappears entirely — see
  `pending-counter-cache-columns-registry-has-no-rails-counterpart`).
- `EncryptableRecord.loadSchemaBang` becomes reachable and its
  `validate_column_size` arm starts running.

## Acceptance criteria

- `model-schema.ts`'s `loadSchemaBang` dispatches the concern overrides, in
  Rails' order, each able to call the next.
- `CounterCache.loadSchemaBang` is reached from schema load, not from
  `registerModel`.
- `EncryptableRecord.loadSchemaBang` has a caller and its
  `validateColumnSize` pass is exercised by a test.
- No concern-level `load_schema!` port is left with zero callers.
