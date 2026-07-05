---
title: "A1a — eager_test: string/scoped/same-table/intersection joins"
status: blocked
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: "Blocked behind RFC 0019 assoc-eager-split-canonical (eager.test.ts is grandfathered; large file, expect multiple conversion PRs). Un-skip only after the file is canonical and off the exclude list."
---

## Context

Split off from `a1-eager-preloader-semantics` (RFC 0030). These eager_test.rb cases exercise eager-loading/preloading over **string SQL joins, scoped joins, same-table joins, intersection joins, and polymorphic mixed-table conditions** — semantics `associations/eager.ts` / `preloader.ts` do not yet support. They stay `it.skip` in `packages/activerecord/src/associations/eager.test.ts` with BLOCKED/ROOT-CAUSE tags. Port faithfully against canonical models (Member, Club, Membership, Rating, Tagging) + official fixtures — do NOT invent tables/models.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip (or reclassify per RFC Deferred table)

- loading association with string joins
- loading with scope including joins
- loading association with same table joins
- loading association with intersection joins
- loading polymorphic association with mixed table conditions
- eager association with scope with joins
- string id column joins
- preloading associations with string joins and order references
- eager loading with conditions on string joined table preloads

## Acceptance criteria

- [ ] Each listed test un-skipped and passing on canonical SQLite (Rails-faithful, canonical models + fixtures), or reclassified permanent-skip with a recorded reason.
- [ ] No new gate-mismatches.
