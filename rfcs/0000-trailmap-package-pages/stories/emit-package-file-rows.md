---
title: "trails: package-summary.ts adds one row per Rails file api-compare pairs"
status: draft
updated: 2026-11-05
rfc: "0000-trailmap-package-pages"
cluster: package-summary-data
packages: [scripts]
deps: [emit-package-summary-json]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of `emit-package-summary-json` so each half stays reviewable. The
per-file data exists in `scripts/api-compare/output/api-comparison*.json`
(`results[].files[]`, `scripts/api-compare/compare.ts:26`) and per-test-file
data in `scripts/test-compare/output/convention-comparison.json`; nothing
joins them per Rails file today. The files page and the overview's
"biggest-gap file" read the result.

## Acceptance criteria

- [ ] `package-summary.json` gains `files[]`: one row per Rails `.rb` file
      api-compare pairs with a package, `{package, rubyFile, tsFile|null,
methodsMatched, methodsMissing, testsMatched, testsTotal}`, `tsFile` `null`
      for an unported file.
- [ ] Test counts join on the Rails test file that covers `rubyFile` by
      test-compare's own mapping; a file with no test file has
      `testsTotal: 0`.
- [ ] A unit test over a fixture api-compare and test-compare output pins the
      join, including an unported file.
