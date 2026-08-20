---
title: "Preload writeback belongs on Association#target=, not a proxy hook"
status: ready
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while retiring the proxy's load/merge block in #6755
(`retire-collection-proxy-load-and-merge-block`), which named
`_hydrateFromPreload` in its inventory but did not carry it in its acceptance
criteria.

`CollectionProxy#_hydrateFromPreload`
(`packages/activerecord/src/associations/collection-proxy.ts`, 5 lines) is a
proxy-side reimplementation of Rails' preload writeback:

```ts
_hydrateFromPreload(records: T[]): void {
  const unsaved = this._target.filter((r) => r.isNewRecord());
  this._target = unsaved.length > 0 ? [...records, ...unsaved] : records;
  this._targetLoaded = true;
}
```

Rails has no proxy-side hook. The preloader writes through the association:

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

and `Association#target=` is the two-line writer that also flips the flag:

```ruby
def target=(target)
  @target = target
  loaded!
end
```

(`vendor/rails/activerecord/lib/active_record/associations/association.rb:100-105`)

So all three of trails' pieces — the not-persisted partition, the concat order,
and the loaded flag — belong to `associate_records_to_owner` + `target=`, not to
the proxy.

Callers of the trails hook: `associations.ts:1791,1847` and
`association.ts:634-638`.

Note a live semantic difference to resolve while converging: trails partitions
with `isNewRecord()`, Rails with `reject(&:persisted?)`. They differ for a
destroyed record, which is neither new nor persisted — Rails keeps it, trails
drops it.

## Converged shape

`_hydrateFromPreload` disappears. The preload writeback computes
`notPersistedRecords` from `association.target` with the `persisted?` predicate
and assigns `association.target = records + notPersistedRecords`, letting the
association's `target=` / `setTarget` equivalent set the loaded flag — one
writer, at the Rails names, on the association.

Related and adjacent, not duplicates: `collection-proxy-store-direction-is-inverted-vs-rails`
and `collection-proxy-two-loadedness-accessors` (RFC 0075) cover the store
direction and the flag accessors this writeback lands on; the closed
`exported-association-helper-skips-preload-hydration` covered a different caller.

## Acceptance criteria

- `_hydrateFromPreload` no longer exists in `collection-proxy.ts`; the three
  call sites write through the association's target writer.
- The not-persisted partition uses the `persisted?` predicate, matching
  `preloader/association.rb:251`, with the destroyed-record case covered by a
  test.
- Preload suites pass unrenamed, incl.
  `packages/activerecord/src/associations/preloader/`.
- `pnpm parity:api:calls` / `:args` add zero rows; `pnpm parity:api:extra
--package activerecord` does not grow.
