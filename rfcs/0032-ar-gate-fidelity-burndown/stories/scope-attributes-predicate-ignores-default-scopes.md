---
title: "scope-attributes-predicate-ignores-default-scopes"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-23T21:02:10Z"
assignee: "scope-attributes-predicate-ignores-default-scopes"
blocked-by: null
closed-reason: null
---

## Context

Found by per-entry wide-call verification. Rails `scope_attributes?` has two
layers: the base (vendor/rails/activerecord/lib/active_record/scoping.rb:22-24,
`current_scope`) and the Default override
(vendor/rails/activerecord/lib/active_record/scoping/default.rb:55-57):
`super || default_scopes.any? || respond_to?(:default_scope)`. Trails
`isScopeAttributes` (packages/activerecord/src/scoping.ts:144-146) returns
`!!this.currentScope` only — a model with a default_scope but no current
scope answers false, so `populate_with_current_scope_attributes`-equivalent
paths skip seeding new records with default-scope attributes.

## Acceptance criteria

- isScopeAttributes includes the default-scopes arm as Rails does.
- Rails' default-scoping tests covering new-record attribute seeding pass.
