---
title: "Track 9 — scattered single-test association gaps"
status: ready
updated: 2026-06-04
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 110
priority: 38
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A bundle of small, independent single-test gaps grouped as "Track 9" in the
associations gap plan. Small enough to land together (or as a tight batch).

## Acceptance criteria

- [ ] Counter cache updates in memory after create/push/empty (3 tests,
      `has-many-associations.test.ts`)
- [ ] readonly check on save for belongs-to (1 test,
      `belongs-to-associations.test.ts`)
- [ ] `belongsToRequiredByDefault` config flag (1 test, `required.test.ts`)
- [ ] Arel join node in left-outer-join edge cases (3 tests,
      `left-outer-join-association.test.ts`)
- [ ] Inner-join edge cases (2 tests, `inner-join-association.test.ts`)

## Notes

From the associations gap plan (Track 9). Each item is independently shippable;
bundled here to stay near the LOC ceiling. Split if any one grows.
