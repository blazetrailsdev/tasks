---
title: "W7 — _namedInnerJoins merger/scope fix"
status: claimed
updated: 2026-06-10
rfc: "0016-ar-test-compare-100"
cluster: integrated
deps: []
deps-rfc: []
est-loc: 60
pr: null
claim: "2026-06-10T15:57:23Z"
assignee: "w7-named-inner-joins-fix"
blocked-by: null
---

## Context

4 fixes from #2808 + #2840 review-response that never landed. Verified on
`main` 2026-06-02: `merger.ts` has 0 refs to `_namedInnerJoins`; it exists in
`query-methods.ts:126,895,2425` but is absent from
`mergeJoins`/`STRUCTURAL_FIELDS`/`isEmptyScope`/`referencesEagerLoadedTables`.

1. `relation/merger.ts#mergeJoins` drops `_namedInnerJoins` on `merge()`.
2. `STRUCTURAL_FIELDS` (`query-methods.ts`) omits `_namedInnerJoins`.
3. `relation.ts#isEmptyScope` omits `_namedInnerJoins`.
4. `relation.ts#referencesEagerLoadedTables` can't see named-inner-join aliases.

## Acceptance criteria

- [ ] All 4 fixes applied + regression test.
- [ ] `merge()`-bearing named-inner-join cases pass locally.

## Notes

⚠ **Do this before Phase 4** — gates `merge()`-bearing eager tests.
Ours: `relation/merger.ts`, `relation/query-methods.ts:126`, `relation.ts`.
Rails: `lib/active_record/relation/merger.rb`, `query_methods.rb`.
