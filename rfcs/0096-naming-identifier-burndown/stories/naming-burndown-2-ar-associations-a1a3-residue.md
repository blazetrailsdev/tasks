---
title: "Converge the a3 call-argument residue in associations (through-counter, multiset, join-constraints, counter-in-memory)"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6455
claim: "2026-08-13T03:16:53Z"
assignee: "naming-burndown-2-ar-associations-a1a3-residue"
blocked-by: null
closed-reason: null
---

## Context

Residue from #6420 (RFC 0096 wave 2, associations). That PR converged 24 of 38
`naming` call-argument rows by renaming locals/parameters; the rows below are
the a3 remainder — an extra trails local or helper stands where Rails passes
the expression directly, so no rename alone can close them. Each needs the
body restructured to Rails' shape.

Sibling of `naming-burndown-2-ar-abstract-adapters-a1a3-residue`.

### 1. `has_many_through_association.rb:164-166` — `decrement_counter`

```ruby
counter = source_reflection.counter_cache_column
klass.decrement_counter counter, records.map(&:id)
```

`packages/activerecord/src/associations/has-many-through-association.ts`
(`deleteRecords`) builds a defensive `ids` local instead — a `.map` plus a
`.filter((id) => id != null)` plus an `ids.length > 0` guard Rails does not
have. Converged shape: pass `records.map((r) => r.id)` at the call site. The
null-filter and length guard need justifying at the call site with a Rails
cite or deleting; they are the reason the row cannot be renamed away.

### 2. `has_many_through_association.rb:177-191` — `mark_occurrence(distribution, record)`

```ruby
def difference(a, b)
  distribution = distribution(b)
  a.reject { |record| mark_occurrence(distribution, record) }
end
```

The TS local is `dist`, because `const distribution = distribution(b)` is a
TDZ error in TS where Ruby's same-named local/method pair is legal, and the
module-level helper cannot be qualified. This is a real TS shortcoming, but
the settled workaround has not been tried: e.g. hosting `distribution` /
`markOccurrence` as methods so the call reads `this.distribution(b)` and the
local can take the Rails name. `markOccurrence`'s own first parameter is
`buckets` and should be `distribution` (has_many_through_association.rb:189)
regardless — that half is a plain rename and is not blocked.

### 3. `join_dependency/join_association.rb:92-99` — `append_constraints`

```ruby
join_string = Arel::Nodes::And.new(constraints.unshift join.left)
```

`packages/activerecord/src/associations/join-dependency/join-association.ts`
builds an `allExprs` local and adds a `length === 1` branch Rails does not
have. Converged shape: `new Nodes.And([join.left, ...constraints])` at the
call site, with the single-element branch removed or justified against Arel's
readonly join nodes.

### 4. `collection_association.rb:104-108` — `update_counter_in_memory`

```ruby
def update_counter_in_memory(difference, reflection = reflection())
  if reflection.counter_must_be_updated_by_has_many?
    counter = reflection.counter_cache_column
```

`has-many-association.ts#updateCounterInMemory` names that local `column`;
Rails names it `counter`. A plain rename, deliberately left out of #6420
because it fell outside that story's measured file set.

## Acceptance criteria

- [ ] Each of the four sites above matches the Rails body, or carries a
      call-site justification with a Rails cite for the part that cannot.
- [ ] The corresponding `naming` rows drop out of
      `pnpm parity:api:calls:args:report` for these files.
- [ ] `pnpm parity:api:calls` / `:args` stay green with no baseline row added.
- [ ] Association and eager-loading tests pass on all three adapters.
