---
title: "A1h — eager_test: scope-stack + exclusive/default scope preload"
status: claimed
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: "2026-06-22T21:55:15Z"
assignee: "a1-eager-scope-stack-exclusive-scope"
blocked-by: null
---

## Context

Split off from `a1-eager-preloader-semantics` (RFC 0030). eager_test.rb cases depending on the **scope stack** (`scoping {}`) and `default_scope` exclusivity during preload — circular preloads under `scoping`, and `preload` using the association's exclusive scope rather than the caller's. Needs current-scope-aware preloader.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- scoping with a circular preload
- circular preload does not modify unscoped
- preload belongs to uses exclusive scope
- preload has many uses exclusive scope

## Acceptance criteria

- [ ] Each listed test un-skipped + passing (Rails-faithful) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
