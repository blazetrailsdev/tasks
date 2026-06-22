---
title: "A1g — eager_test: preload via composite query_constraints / CPK"
status: ready
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

Split off from `a1-eager-preloader-semantics` (RFC 0030). eager_test.rb cases preloading associations keyed by a **composite query_constraints / CPK** (belongs_to, has_many, has_many-through, and a CPK model sharing one key column). Needs composite-key preloader key building. Canonical CPK models (Cpk::Order, Cpk::Book, etc.) + fixtures.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- preloading belongs_to association associated by a composite query_constraints
- preloading has_many association associated by a composite query_constraints
- preloading has_many through association associated by a composite query_constraints
- preloading belongs_to CPK model with one of the keys being shared between models

## Acceptance criteria

- [ ] Each listed test un-skipped + passing (canonical CPK models/fixtures, Rails-faithful) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
