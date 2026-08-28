---
title: "ForcedMutationTracker#clone_value deep-dups where Rails clones one level"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
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

Rails' `ForcedMutationTracker#clone_value`
(`vendor/rails/activemodel/lib/active_model/attribute_mutation_tracker.rb:144-149`)
is a SHALLOW dup:

```ruby
def clone_value(attr_name)
  value = fetch_value(attr_name)
  value.duplicable? ? value.clone : value
rescue TypeError, NoMethodError
  value
end
```

trails' counterpart
(`packages/activemodel/src/attribute-mutation-tracker.ts`) calls a module-local
`dupValue` that recurses: `Array.isArray(value)` maps `dupValue` over the
elements, and a plain object copies every entry through `dupValue`. Ruby's
`clone` copies one level; the nested elements stay shared. PR #7172 moved
`clone_value` onto the tracker at the Rails name and signature, but left the
deep-dup body alone as out of scope for a parameter-name story.

Two further gaps in the same body: there is no `rescue TypeError, NoMethodError`
arm (Ruby returns the un-duped `value` when `clone` raises), and the
`instanceof Date` / Temporal special-cases are trails inventions standing in for
`duplicable?`.

## Converged shape

`cloneValue(attrName)` fetches the value and dups it ONE level — the JS analogue
of `duplicable? ? clone : value`: an Array becomes `value.slice()`, a plain
object `{ ...value }`, a `Date` a new `Date`, and everything else (primitives,
frozen/immutable Temporal values, class instances) is returned as-is. The
recursion goes away with it.

## Acceptance criteria

- `cloneValue` dups one level, at the Rails file:line above.
- `dirty` tracking tests stay green in activemodel and in the three AR lanes —
  in particular the ForcedMutationTracker path exercised by
  `packages/activemodel/src/dirty*.test.ts`. If a test depends on the deep copy,
  read the Rails test first: a deep-clone expectation is itself the divergence.
- `pnpm parity:api:calls` / `:args` show no new row.
