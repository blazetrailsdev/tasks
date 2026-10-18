---
title: "Association#initialize_attributes reading a Hash's keys has no regression test"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 79
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8767 (`mass-assignment-and-where-read-parameters-to-h-as-a-hash`).

`Association#initialize_attributes` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:217-225`) adds `except_from_scope_attributes.keys.map(&:to_s)` to the keys the scope's create attributes must not overwrite.

`packages/activerecord/src/associations/association.ts` `initializeAttributes` read those keys with `Object.keys`, which answers `[]` for a `Hash` (a `Map`). So `association.build(permitted_params)` let `scope_for_create` overwrite an attribute the caller passed explicitly. #8767 changed the read to ruby-compat `keys`, found by widening the `build` chain's types, and shipped it with no test: no existing test builds through a scoped association with a `Hash`.

## Acceptance criteria

- A test in the trails-only test file beside the association tests builds a record through an association whose scope carries a create attribute (a canonical model with a `where`-scoped `has_many`, per `vendor/rails/v8.0.2/activerecord/test/models/`), passing `new ProtectedParams({...}).permitBang()` with that same attribute set to a different value, and asserts the passed value wins.
- The test fails with `Object.keys` restored in `initializeAttributes` and passes on main.
- Canonical schema, models and fixtures only.
