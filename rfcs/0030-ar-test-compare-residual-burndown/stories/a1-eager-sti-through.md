---
title: "A1e — eager_test: preload/eager-load through STI join models"
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

Split off from `a1-eager-preloader-semantics` (RFC 0030). eager_test.rb cases preloading/eager-loading **through STI join models** (has_one/has_many-through where the through or source is an STI subclass), plus has_one-dependent over the STI Firm/Company model. Needs STI-aware preloader + join-dependency.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- preloading with has one through an sti with after initialize
- eager with has many through an sti join model with conditions on both
- eager with has one through join model with conditions on the through
- eager with has one dependent does not destroy dependent

## Acceptance criteria

- [ ] Each listed test un-skipped + passing (canonical STI models/fixtures, Rails-faithful) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
