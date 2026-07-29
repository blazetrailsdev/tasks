---
title: "preloader-middle-records-from-records-by-owner"
status: in-progress
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5623
claim: "2026-07-29T23:36:02Z"
assignee: "preloader-middle-records-from-records-by-owner"
blocked-by: null
closed-reason: null
---

## Context

`Preloader::ThroughAssociation` derives its middle records from the through
loaders' `preloadedRecords`:

`packages/activerecord/src/associations/preloader/through-association.ts:268`
— `_getMiddleRecords()` returns
`this._getThroughPreloaders().flatMap((l) => l.preloadedRecords)`.

Rails derives them from `records_by_owner` instead
(`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:74-96`):

```ruby
def middle_records
  through_records_by_owner.values.flatten
end

def through_records_by_owner
  @through_records_by_owner ||= through_preloaders.map(&:records_by_owner).reduce(:merge)
end
```

`Association#records_by_owner` returns `target_for(owner)` when the owner
already has the association loaded, so a pre-loaded through record still reaches
`middle_records`. `preloaded_records` does not: nothing was queried, so it is
empty.

Consequence: when every owner already has the through association loaded, the
trails preloader gets `middleRecords === []`, `_getSourcePreloaders()` returns
`[]`, and the target association is marked loaded with **zero rows and zero
queries** instead of preloading the source with one query.

The existing escape hatch `_alreadyLoadedThroughByOwner()`
(`through-association.ts:303`) covers only reflections carrying a `sourceType`
option; Rails' equivalent check is unconditional
(`through_association.rb:20` — `owners.first.association(through_reflection.name).loaded?`).

Reproducer, currently marked `it.fails` in
`packages/activerecord/src/associations.test.ts` (PreloaderTest, "preload
through records with already loaded middle record", ported from
`vendor/rails/activerecord/test/cases/associations_test.rb:906`):

```text
members(:groucho) → load organization (the through record) → preload
:organization_member_details_2
Rails:  1 query, both member_details
trails: 0 queries, empty collection
```

Not fixed in PR #5618 (that PR ports `PreloaderTest`'s fixture declaration):
the faithful fix makes the middle-record derivation read the async
`recordsByOwner()`, so `_getMiddleRecords()` / `_getSourcePreloaders()` /
`_dataAvailable()` all have to become async or be restructured — a preloader
change with its own blast radius.

## Acceptance criteria

- `_getMiddleRecords()` derives middle records from the through loaders'
  `recordsByOwner()`, matching `through_association.rb:74-96`, so an
  already-loaded through record still feeds the source preloader.
- The `sourceType`-only gate in `_alreadyLoadedThroughByOwner()` is reconciled
  with Rails' unconditional `owners.first.association(through).loaded?` check
  (`through_association.rb:20`), keeping the `source_type` row filter Rails
  applies inside that branch.
- `preload through records with already loaded middle record` drops `it.fails`
  and passes with 1 query plus a no-query read of both member_details.
- No regression in the nested-through suites
  (`associations/nested-through-associations.test.ts`,
  `associations/has-many-through-associations.test.ts`).
