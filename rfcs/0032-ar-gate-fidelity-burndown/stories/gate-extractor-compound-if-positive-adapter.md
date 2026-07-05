---
title: "Gate extractor: capture positive current_adapter? in compound conjunction conditions"
status: draft
updated: 2026-07-05
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converging `deriveFkQueryConstraints` error types in
`derive-fk-query-constraints-argumenterror-type` (PR #3725).

trails `packages/activerecord/src/reflection.ts:832` guards the
primary-key-inclusion check with `if (ownerPkStr && !primaryQueryConstraints.includes(ownerPkStr))`,
where `ownerPkStr` is `undefined` whenever `this.activeRecord.primaryKey` is an
array (composite PK). This means the guard is **skipped entirely for
composite-PK owners**.

Rails (`vendor/rails/activerecord/lib/active_record/reflection.rb:853`) runs the
check unconditionally:

```ruby
owner_pk = active_record.primary_key
if !primary_query_constraints.include?(owner_pk)
  raise ArgumentError, ...
end
```

So for a composite-PK owner, Rails compares the array `owner_pk` against the
query-constraints list, while trails silently bypasses the guard. This is a
behavioral divergence in the underivable-FK path for composite-PK owners.

trails: `packages/activerecord/src/reflection.ts:832`
Rails: `vendor/rails/activerecord/lib/active_record/reflection.rb:853`

## Acceptance criteria

- [ ] Determine Rails' exact behavior when `owner_pk` is an array and reproduce
      it in `deriveFkQueryConstraints` (match the include/raise semantics).
- [ ] Converge the `ownerPkStr &&` short-circuit so composite-PK owners are not
      silently exempted from the primary-key-inclusion guard.
- [ ] Add/port the corresponding Rails test if one exists; otherwise verify via
      a composite-PK owner with a mismatched query_constraints list.
- [ ] api:compare / test:compare delta non-negative.
