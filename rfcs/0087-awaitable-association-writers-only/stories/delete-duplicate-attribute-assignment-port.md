---
title: "Delete the duplicate _assign_attributes port that takes parity:api's credit for attribute_assignment.rb"
status: draft
updated: 2026-08-08
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `_assignAttribute` in PR #6220.

`ActiveRecord::AttributeAssignment` (`activerecord/lib/active_record/attribute_assignment.rb:6-28`)
has exactly one `_assign_attributes` / `assign_nested_parameter_attributes`
pair. trails has **two** independent ports of them:

1. `packages/activerecord/src/persistence.ts` — the live one. Reached from
   `Base#assignAttributes` (wired at base.ts), and the one PR #6220 converged:
   plain `each_pair` loops, sends through `_assignAttribute`, chains behind a
   send that owes I/O.
2. `packages/activerecord/src/attribute-assignment.ts` — a second, dead-ish
   implementation exported as `InstanceMethods` (`_assignAttributes`,
   `assignNestedParameterAttributes`, `assignMultiparameterAttributes`,
   `executeCallstackForMultiparameterAttributes`,
   `extractCallstackForMultiparameterAttributes`, `typeCastAttributeValue`,
   `findParameterPosition`). Its own header says it exists "for Rails-layout
   parity (`parity:api`)".

The duplicate is what `parity:api` credits for
`activerecord/attribute_assignment.rb`, because it sits at the matching file
path — so the file that actually implements the Ruby (persistence.ts) is scored
against `persistence.rb` while the Ruby it ports is credited to a copy no
caller reaches. It also drifts: #6220 changed the live pair's loop shape and
left the copy on the old one. Its `_assignAttributes` still buckets any
non-Array object as a nested parameter hash, where the live one uses
`isNestedParameterHash` (a Date/Temporal/model value is `typeof "object"` but
is not a Ruby Hash).

Two callers do reach a `_assignAttributes` _method_ on the record —
`associations/association.ts:1105-1108` and
`associations/collection-proxy.ts:1429` — but through ActiveModel's, not this
module's exports.

## Acceptance criteria

- [ ] One `_assign_attributes` / `assign_nested_parameter_attributes` pair
      survives in the package, at the Rails file path
      (`attribute-assignment.ts`), reached by `Base#assignAttributes`.
- [ ] The duplicate is deleted, not left as a parity shim — no exported
      `InstanceMethods` whose members no caller reaches.
- [ ] `pnpm parity:api` credit for `activerecord/attribute_assignment.rb`
      lands on the surviving implementation; delta non-negative.
- [ ] persistence, nested-attributes, multiparameter-attributes and
      attribute-assignment suites green.
