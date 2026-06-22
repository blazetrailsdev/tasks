---
title: "A1d — eager_test: count/size with multi-table conditional"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split off from `a1-eager-preloader-semantics` (RFC 0030). eager_test.rb cases where `count`/`size` over an eager-loaded has_many / has_many-through with a **multi-table conditional** must join-for-count rather than count the preloaded set. `associations/eager.ts` count path lacks this.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- eager count performed on a has many association with multi table conditional
- eager count performed on a has many through association with multi table conditional
- eager with multi table conditional properly counts the records when using size

## Acceptance criteria

- [ ] Each listed test un-skipped + passing (Rails-faithful) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
