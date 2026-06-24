---
title: "Converge Association#inversable() to Rails matches_foreign_key? (de-duplicate inline AR wiring)"
status: in-progress
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4071
claim: "2026-06-24T17:26:39Z"
assignee: "converge-association-inversable-matches-foreign-key"
blocked-by: null
---

## Context

trails' base `Association#inversable()`
(packages/activerecord/src/associations/association.ts ~line 526) is
INCOMPLETE vs Rails. It returns only
`record.isNewRecord() || this.owner.isNewRecord()`, omitting Rails'
`matches_foreign_key?` clause:

```ruby
# activerecord/lib/active_record/associations/association.rb:406
def inversable?(record)
  record &&
    ((!record.persisted? || !owner.persisted?) || matches_foreign_key?(record))
end
```

As a result, when both owner and record are persisted, trails' base path
never wires the inverse. The Rails `set_inverse_instance_from_queries`
behaviour is instead reimplemented inline in
`AssociationRelation.toArray`'s `_instantiateBlock`
(packages/activerecord/src/association-relation.ts ~line 295), which
compares each child FK to the owner PK and caches the singular target via
`_cacheSingularTarget` only on a match.

PR #4033 made that inline comparison BigInt/number value-equal (via
`associationKeysEqual`) for the PG bigserial flip, but did NOT converge the
structural deviation: the FK-match logic lives in AssociationRelation rather
than in `Association#inversable()` + `matches_foreign_key?` as Rails layouts
them. Other inverse-wiring entry points that go through the base
`inversedFromQueries` → `inversable()` still get the incomplete check.

## Acceptance criteria

- [ ] Port Rails `Association#matches_foreign_key?`
      (association.rb:411) and fold it into `Association#inversable()` so the
      base method matches Rails (handles `foreign_key_for?` both directions,
      uses value-equality across number/BigInt via the existing
      `associationKeysEqual` helper).
- [ ] Remove the duplicated FK-match logic inlined in
      `AssociationRelation._instantiateBlock` once the base path is faithful,
      OR document why the AR-level wiring must stay separate.
- [ ] Test names match Rails verbatim; api:compare / test:compare delta
      non-negative on sqlite/PG/mysql.
