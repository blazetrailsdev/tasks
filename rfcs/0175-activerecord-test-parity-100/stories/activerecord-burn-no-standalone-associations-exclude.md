---
title: "activerecord: burn eslint/no-standalone-associations-exclude.json (90 entries in 25 files)"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: lint-registers
packages: ["activerecord"]
deps: ["prune-stale-lint-ratchet-allowlists"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/no-standalone-associations` forbids tests that declare associations on ad-hoc models; its
only-shrink exclude holds **90** activerecord entries:

- `associations/source-type-validation.trails.test.ts` — 9
- `associations/collection-proxy-count.trails.test.ts` — 8
- `associations/disable-joins-nested-through.trails.test.ts` — 8
- `associations/cp-count-disable-joins-through.trails.test.ts` — 5
- `associations/disable-joins-association-scope.trails.test.ts` — 5
- `associations/disable-joins-composite-key.trails.test.ts` — 5
- `associations/disable-joins-composite-nested.trails.test.ts` — 5
- `associations/disable-joins-polymorphic-nonid-pk.trails.test.ts` — 5
- `associations/disable-joins-routing-widening.trails.test.ts` — 5
- `reserved-word.test.ts` — 5
- `associations/join-dependency-quoting.trails.test.ts` — 4
- `reflection.test.ts` — 4
- `associations/association-scope.trails.test.ts` — 2
- `associations/has-one-associations.test.ts` — 2
- `associations/join-dependency-alias-tracker.trails.test.ts` — 2
- `associations/join-dependency-duplicate-objects.trails.test.ts` — 2
- `associations/join-dependency-nested-hydration.trails.test.ts` — 2
- `associations/required.test.ts` — 2
- `autosave-association.test.ts` — 2
- `autosave-association.trails.test.ts` — 2
- `reflection.trails.test.ts` — 2
- `associations/join-dependency-belongs-to-dedup.trails.test.ts` — 1
- `associations/join-dependency-extra-columns.trails.test.ts` — 1
- `associations/join-dependency-polish.trails.test.ts` — 1
- `relation/unscope-coverage.trails.test.ts` — 1

`prune-stale-lint-ratchet-allowlists` (RFC 0127) removes the stale ones first.

## Acceptance criteria

- [ ] Each test moves onto canonical models (`test-helpers/models/`) mirroring the Rails test it ports, and its entry is removed; the file is deleted when empty.
