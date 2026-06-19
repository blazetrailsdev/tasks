---
title: "Converge CompositePrimaryKeyMismatchError message + checkValidityBang guard to Rails"
status: ready
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3650 (check-validity-in-association-initialize), which made
`AbstractReflection#checkValidityBang` run at construction for all macros. Two
residual deviations from Rails remain in the composite-PK/FK branch of
`checkValidityBang` (`packages/activerecord/src/reflection.ts:1055-1080`):

1. **Error message.** trails' `CompositePrimaryKeyMismatchError`
   (`packages/activerecord/src/associations/errors.ts:203`) produces
   `Association <name> on <owner> has a composite primary key mismatch.`
   Rails' message (`activerecord/lib/active_record/associations/errors.rb:187`)
   is detailed and macro-specific:
   `Association <ar>#<name> primary key <apk> doesn't match with foreign key
<fk>. Please specify query_constraints, or primary_key and foreign_key
values.` — using `active_record_primary_key` for has_one/collection and
   `association_primary_key` for belongs_to. The trails constructor passes
   `(activeRecord.name, name)` only, dropping the PK/FK detail.

2. **Guard condition.** Rails gates the check on
   `!polymorphic? && (klass.composite_primary_key? || active_record.composite_primary_key?)`.
   trails adds an extra `|| Array.isArray(this.foreignKey)` clause
   (reflection.ts:1062), so a non-composite-PK model with an array foreign key
   enters the check even when Rails would skip it. It only raises on a genuine
   length mismatch, but the superset guard is a divergence worth converging.

## Acceptance criteria

- [ ] `CompositePrimaryKeyMismatchError` carries Rails' detailed,
      macro-specific message (active_record#name, the relevant primary key,
      and foreign key, plus the query_constraints/primary_key/foreign_key
      remediation hint).
- [ ] The `checkValidityBang` composite guard matches Rails
      (`klass.composite_primary_key? || active_record.composite_primary_key?`),
      dropping the extra `Array.isArray(foreignKey)` clause unless a test
      demonstrates Rails needs it.
- [ ] Existing composite-PK mismatch tests still pass (assert on the class;
      update any message assertions to the Rails text).
