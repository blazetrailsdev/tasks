---
title: "Audit CollectionProxy._checkStrictLoading call sites against Rails find_target"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into strict-loading-check-in-reader-not-find-target — auditing the ~13 CollectionProxy._checkStrictLoading call sites IS the deletion that follows moving the gate onto find_target"
---

## Context

`CollectionProxy._checkStrictLoading()` (`collection-proxy.ts:1130`) raises
`StrictLoadingViolationError` from ~13 proxy methods (1766, 1851, 1867, 1883,
1899, 3141, 3151, 3163, 3175, 3489, 3512, 4009 and, until PR #5910, `find`).

Rails raises strict-loading violations from exactly one place on this path:
`Association#find_target` (`activerecord/lib/active_record/associations/association.rb`),
which checks `violates_strict_loading?` before querying. Methods that go
through `scope.<something>` rather than `find_target` — `scope.find`,
`scope.pluck`, `scope.pick`, and friends — do NOT raise in Rails.

PR #5910 removed the `find` call site while converging `CollectionProxy#find`
into Rails' one-line delegation to `@association.find`: Rails' `find` reaches
`scope.find(*args)`, never `find_target`, and neither Rails' nor trails' test
suite covered `proxy.find` under strict loading (checked `strict_loading_test.rb`
and all of `strict-loading*.test.ts`). The remaining call sites were out of
that PR's scope and are unexamined — each is either a genuine Rails path
through `find_target` or the same invention `find` had.

## Acceptance criteria

- Each remaining `_checkStrictLoading()` call site in `collection-proxy.ts` is
  audited against Rails: either the Rails method reaches `find_target` (keep,
  and note which Rails frame does the raising), or it does not (remove).
- Any site whose removal changes observable behaviour is covered by a test
  named after the Rails test that pins it, if one exists; if Rails has no test,
  the behaviour follows the Rails source and the trails-only assertion says so.
- If the audit finds the checks are load-bearing for a trails-specific reason
  (e.g. a sync reader with no Rails analogue), that reason is recorded at the
  call site rather than left implicit.
