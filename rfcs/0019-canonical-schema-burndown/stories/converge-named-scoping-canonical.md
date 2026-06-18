---
title: "Converge scoping/named-scoping.test.ts to canonical models"
status: in-progress
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 3584
claim: "2026-06-18T13:45:41Z"
assignee: "converge-named-scoping-canonical"
blocked-by: null
---

## Context

`packages/activerecord/src/scoping/named-scoping.test.ts` is grandfathered in
`eslint/require-canonical-schema-exclude.json` and contains partial-declaration
bespoke models that mask `updated_at` (story
`converge-partial-decl-models-updated-at` context cited line ~863). Rails source:
`vendor/rails/activerecord/test/cases/named_scope_test.rb`.

## Acceptance criteria

- [x] Open `named_scope_test.rb` first; port bodies/assertions word-for-word.
- [x] Replace bespoke partial models with canonical models + fixtures carrying
      the full column set.
- [x] Rails-faithful cacheKey/column expectations; never ratify `model/id`.
- [x] Remove `scoping/named-scoping.test.ts` from
      `eslint/require-canonical-schema-exclude.json` in the converting PR.

## Definition of done

named-scoping.test.ts uses canonical models/fixtures, grandfathered entry
removed, expectations Rails-faithful.
