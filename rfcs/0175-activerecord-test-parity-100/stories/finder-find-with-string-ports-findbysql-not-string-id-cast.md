---
title: "finder.test 'find with string' ports findBySql smoke, not Rails' string-id cast assertion"
status: done
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8291
claim: "2026-09-30T17:49:22Z"
assignee: "converge-inline-fixture-resolvers-onto-fixture-load-path"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/finder.test.ts:768` — `it("find with string")` —
does not port Rails' `test_find_with_string`
(vendor/rails/activerecord/test/cases/finder_test.rb:186), which asserts
`Topic.find(1).title == Topic.find("1").title` (string id casts to the same
record through the bind — the exact behavior PR #5139 converged). Our test
instead declares a bespoke inline `Topic` with `attribute("title")`, creates a
row, and asserts `findBySql('SELECT * FROM "topics"')` returns an array —
neither the string-id find nor the canonical Topic model/fixtures.

## Acceptance criteria

- [ ] `it("find with string")` asserts
      `(await Topic.find(1)).title === (await Topic.find("1")).title` using
      the canonical `test-helpers/models/topic.ts` + `fixtures(["topics"])`
      (no bespoke inline model).
- [ ] Test name unchanged (parity:test match).
