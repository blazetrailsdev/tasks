---
title: "mark_occurrence and distribution port verbatim, without the inverted guard or the bucket array"
status: draft
updated: 2026-09-06
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HasManyThroughAssociation#mark_occurrence` /`#distribution`
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:189-191,193-197`):

```ruby
def mark_occurrence(distribution, record)
  distribution[record] > 0 && distribution[record] -= 1
end

def distribution(array)
  array.each_with_object(Hash.new(0)) do |record, distribution|
    distribution[record] += 1
  end
end
```

The port (`packages/activerecord/src/associations/has-many-through-association.ts:467-484`)
diverges twice in the same two bodies:

- `markOccurrence` inverts Rails' `&&` into a negated early return —
  `if (!bucket || bucket.count <= 0) return false; bucket.count -= 1; return true;`
  where Rails is one `a > 0 && a -= 1` expression with no `if` and no early
  return. This is the residual row the arms report's short-circuit projection
  still flags after #7579 taught the splice to resolve the same-named
  delegation: `and` on the Ruby side against `if` + `or` on ours.
- `distribution` is an array of `{ record, count }` buckets scanned with
  `Array#find` and `Base#equals`, where Rails is a `Hash.new(0)` keyed on the
  record — so the port's `Occurrences` type is a trails invention standing in
  for a Ruby Hash with a zero default.

Both bodies are additionally reached through same-named class members that
merely delegate to them (`:57-68`), themselves carrying
`@noRailsEquivalent CONVERGEABLE` receipts.

## Acceptance criteria

- [ ] `markOccurrence` is the single Rails expression: the `> 0` test and the
      decrement joined by `&&`, no inverted guard and no early return.
- [ ] `distribution` builds a Hash-with-zero-default analogue keyed on the
      record rather than an array scanned with `find`.
- [ ] The short-circuit projection no longer flags
      `associations/has-many-through-association.ts#markOccurrence`.
- [ ] Nothing new gates.
