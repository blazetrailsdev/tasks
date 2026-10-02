---
title: "activerecord: has_query_constraints? reads the class's own @has_query_constraints, which holds the list"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
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

Surfaced by trails#8418, which made `query_constraints_list` read its memo as an own property (a Ruby
class ivar, not inherited through the prototype chain). Two siblings still read inherited state.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:212-221`):

```ruby
def query_constraints(*columns_list)
  raise ArgumentError, "You must specify at least one column to be used in querying" if columns_list.empty?

  @query_constraints_list = columns_list.map(&:to_s)
  @has_query_constraints = @query_constraints_list
end

def has_query_constraints? # :nodoc:
  @has_query_constraints
end
```

`packages/activerecord/src/persistence.ts`:

- `queryConstraints` sets `_hasQueryConstraints = true` where Rails stores the list itself.
- `hasQueryConstraints` returns `!!this._hasQueryConstraints`, which a subclass reads from its
  parent through the prototype chain. In Rails a class ivar is the class's own: a subclass that
  never called `query_constraints` answers `nil`.
- `_inMemoryQueryConstraintsHash` (`persistence.rb:837-845`) keys the single-key arm by
  `this.constructor.primaryKey`; Rails keys it by the record's `@primary_key`, as
  `_queryConstraintsHash` now does (`:852-860`).

## Acceptance criteria

- [ ] `queryConstraints` stores the list in `_hasQueryConstraints`, as Rails does.
- [ ] `hasQueryConstraints` reads `_hasQueryConstraints` as an own property of the class it is
      asked of, the way `queryConstraintsList` reads `_queryConstraintsList`.
- [ ] `_inMemoryQueryConstraintsHash` keys by the record's `_primaryKey`.
- [ ] A trails test shows a subclass of a class that called `query_constraints` answering `nil`
      from `has_query_constraints?` (it fails on `main`). The CPK association and autosave tests
      that set `_queryConstraintsList` / `_hasQueryConstraints` directly stay green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/persistence.trails.test.ts packages/activerecord/src/associations.test.ts packages/activerecord/src/autosave-association.test.ts
```
