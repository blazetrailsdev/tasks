---
title: "Converge Relation#include? onto Rails' id local"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6363
claim: "2026-08-11T15:26:09Z"
assignee: "pg-query-canceled-unhandled-rejection-recurrence"
blocked-by: null
closed-reason: null
---

## Context

Residual from `naming-burndown-activerecord-relation` (PR #6352). Left as a
`naming` call-arg row because it is a body-shape convergence, not a rename.

Rails `FinderMethods#include?`
(vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:389-403):

```ruby
def include?(record)
  return false unless record.is_a?(model)

  if loaded? || offset_value || limit_value || having_clause.any?
    records.include?(record)
  else
    id = if record.class.composite_primary_key?
      record.class.primary_key.zip(record.id).to_h
    else
      record.id
    end

    exists?(id)
  end
end
```

trails (`packages/activerecord/src/relation.ts:6174`) computes the same two
values but never binds Rails' `id` local: the composite arm builds a
`conditions` hash in an imperative `pk.forEach` loop and the simple arm passes
something else, so `exists?` is called with `conditions` rather than `id`. The
behaviour matches — this is the ported-body-shape half.

Note the PR body for #6352 mischaracterised this row as an argument defect
("composite-PK hash where Rails passes `record.id`"). It is not: Rails builds
the same hash. Only the local name and the assign-then-call shape differ.

## Acceptance criteria

1. `include` binds a single `id` local via a conditional expression, mirroring
   the Rails `id = if … else … end`, and calls `exists(id)` from both arms.
2. The composite arm uses the `primary_key.zip(record.id).to_h` shape rather
   than an imperative loop over `pk.forEach`.
3. The `relation.ts | include? | exists?` row is retired by hand from
   `scripts/api-compare/call-mismatches-exclude/` (only-shrink; no `--write`).
4. No behaviour change; covered by the existing composite-PK `include?` tests.
