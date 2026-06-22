---
title: "A1f — eager_test: polymorphic custom-type/existential/references"
status: claimed
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: "2026-06-22T21:47:16Z"
assignee: "a1-eager-polymorphic-references-existential"
blocked-by: null
---

## Context

Split off from `a1-eager-preloader-semantics` (RFC 0030). eager_test.rb **polymorphic** preload cases: custom `foreign_type`, the existential predicate (`.any?`) with/without a `select`, and references to the associated table. Needs preloader polymorphic-type grouping + existential/select handling. Canonical Sponsor/Member/Essay models + fixtures.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- preloading polymorphic with custom foreign type
- preloading with a polymorphic association and using the existential predicate
- preloading with a polymorphic association and using the existential predicate but also using a select
- preloading a polymorphic association with references to the associated table
- eager-loading a polymorphic association with references to the associated table

## Acceptance criteria

- [ ] Each listed test un-skipped + passing (Rails-faithful, canonical models/fixtures) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
