---
title: "Converge Association#inversable() short-circuit to Rails !persisted? (not isNewRecord)"
status: ready
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Association#inversable()`
(packages/activerecord/src/associations/association.ts:557) currently reads:

```ts
return record.isNewRecord() || this.owner.isNewRecord() || this.matchesForeignKey(record);
```

Rails' `inversable?` (vendor/rails/activerecord/lib/active_record/associations/association.rb:406)
is:

```ruby
record && ((!record.persisted? || !owner.persisted?) || matches_foreign_key?(record))
```

`isNewRecord()` is NOT the negation of `persisted?`: a record is `persisted?`
only when it is neither a new record NOR destroyed. For a **destroyed**
record `isNewRecord()` is false but `persisted?` is also false — Rails would
treat it as inversable (short-circuit true), trails' `isNewRecord()` form
would fall through to `matchesForeignKey`. PR #4071 folded
`matches_foreign_key?` into the base method but intentionally kept the
existing `isNewRecord()` short-circuit to limit blast radius; the
`persisted?` convergence is deferred here.

## Acceptance criteria

- [ ] Replace `record.isNewRecord() || this.owner.isNewRecord()` with the
      Rails `!record.persisted?() || !this.owner.persisted?()` form so a
      destroyed record on either side short-circuits to inversable, matching
      Rails `inversable?`.
- [ ] Verify no inverse-of / destroy-path test regresses (inverse-associations,
      destroy-\* suites); api:compare / test:compare delta non-negative.
