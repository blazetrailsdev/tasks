---
title: "autosave-weakened-assertion-restoration"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

9 assertion-VALUE mismatches in `autosave-association.test.ts` vs
`vendor/rails/activerecord/test/cases/autosave_association_test.rb`. Pattern:
Rails asserts concrete counts/strings; trails asserts booleans — i.e. weakened
assertions. Entries: "cyclic autosaves do not add multiple validations" (Rails
1, trails false), "build via block before save" (3 vs false), "build many via
block before save" (4 vs false), "replace on duplicated object" (2 vs false),
"should save changed has one changed object if child is saved" ("NewName" vs
true), "should still work without an associated model" ("Arr"/"The Vile
Serpent" vs true — 2 tests), "should automatically save bang the associated
model" ("The Vile Serpent"/"Arr" vs false — 2 tests). Read each Rails test and
restore the exact expected value assertions.

## Acceptance criteria

- All 9 tests assert Rails' concrete values.
- `--assertions` shows 0 value-mismatches for autosave_association_test.rb.
