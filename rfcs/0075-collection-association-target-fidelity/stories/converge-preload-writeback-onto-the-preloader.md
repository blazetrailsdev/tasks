---
title: "The preload writeback has two invented call sites outside the Preloader"
status: draft
updated: 2026-08-20
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while retiring `CollectionProxy#_hydrateFromPreload` in #6765
(`retire-collection-proxy-hydrate-from-preload`). That PR moved the preload
writeback off the proxy and onto the association's `target=`, but it could only
converge the _writer_ — the two trails-only **call sites** it writes from remain,
and neither has a Rails counterpart.

Rails has exactly ONE preload writeback, and it lives in the Preloader:

```ruby
def associate_records_to_owner(owner, records)
  return if loaded?(owner)
  association = owner.association(reflection.name)
  if reflection.collection?
    not_persisted_records = association.target.reject(&:persisted?)
    association.target = records + not_persisted_records
  else
    association.target = records.first
  end
end
```

(`vendor/rails/activerecord/lib/active_record/associations/preloader/association.rb:245-256`)

trails calls its writer — `_associateRecordsToOwner`,
`packages/activerecord/src/associations.ts:1719` — from three places. One is the
real Preloader (`preloader/association.ts:245`, correct). The other two are
inventions:

1. **`association(record, assocName)`**, `associations.ts:1744` and `:1793` — the
   proxy factory re-hydrates a proxy from `_preloadedHolderTarget(record,
assocName)` on every cache miss AND on every cached-but-unloaded hit. Rails'
   `CollectionProxy` never re-reads a preloaded holder; the Preloader has already
   written through `association.target=` by the time any proxy exists, and
   `collection_proxy.rb:33` reads that one seat.
2. **`Association#asyncLoadTarget`**, `associations/association.ts:643` — after
   an async load it copies the result into the dotted proxy's association.
   `Association#async_load_target` (`association.rb:213-217`) does no such thing;
   it kicks off the load and returns `nil`, and there is no second seat to
   share with because Rails' proxy holds no target.

Both exist only because trails historically kept proxy-side target state. #6765
made the seats one object (`proxyAssociation` now returns `@association`,
`collection_proxy.rb:57`), which removes the reason these call sites were needed
without removing the call sites themselves.

Two smaller gaps in the writer itself, deliberately left to the callers by #6765
and noted in review:

- The `return if loaded?(owner)` guard (`:246`) is spelled at each call site as
  `!proxy.loaded` / `!existing.loaded` rather than inside the writer.
- The singular arm (`association.target = records.first`, `:254`) is not ported;
  `_associateRecordsToOwner` is the collection arm only.

## Converged shape

`_associateRecordsToOwner` disappears from `associations.ts`, and the whole
writeback lives once in `Preloader::Association#associate_records_to_owner`
(`preloader/association.ts`) with BOTH arms and the `loaded?(owner)` guard
inside it, exactly as `preloader/association.rb:245-256` has them.

The two invented call sites go away rather than being re-pointed:

- the proxy factory reads the association's `target` like Rails does, because
  the Preloader has already written it — no holder re-read, no partition;
- `asyncLoadTarget` returns the result and nothing else, matching
  `association.rb:213-217`.

Verify with the preloader suites and
`packages/activerecord/src/associations/preloader/associate-records-to-owner-not-persisted.trails.test.ts`,
which pins the `reject(&:persisted?)` partition (a destroyed record survives the
writeback) and must stay green through the move.

## Acceptance criteria

- `_associateRecordsToOwner` no longer exists in `associations.ts`;
  `parity:api:extra --package activerecord` for `associations.ts` does not rise.
- `Preloader::Association#associate_records_to_owner` carries the `loaded?`
  guard and both the collection and singular arms, matching
  `preloader/association.rb:245-256` line for line.
- The `association()` factory no longer re-hydrates from
  `_preloadedHolderTarget`; `asyncLoadTarget` no longer writes to a proxy.
- Preloader, eager-loading and async-association suites pass unrenamed.
