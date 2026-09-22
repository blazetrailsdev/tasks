---
title: "finder-respond-to-dynamic-finders-invisible-to-in"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

Converging finder_respond_to_test.rb (vendor/rails/activerecord/test/cases/finder_respond_to_test.rb:24-46) to `assert_respond_to` gives `assertRespondTo(Topic, "findByTitle")`, which fails. `assertRespondTo` (activesupport/src/testing/assertions.ts:394 `respondsTo`) tests `name in object`, so dynamic finders served by `Topic.respondToMissing` (which returns true for `findByTitle`, `findByTitle!`, `findByTitleAndAuthorName`, `findByHeading`) are invisible. Parked as it.skip in packages/activerecord/src/finder-respond-to.test.ts (4 tests). Cause not further investigated.

## Acceptance criteria

- `assertRespondTo`/`respond_to?` port consults `respondToMissing` (Rails `respond_to_missing?`), and the 4 parked tests are un-skipped and green.
