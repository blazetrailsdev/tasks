---
title: "select_association_list callers should pass joins_values, not a pre-filtered subset"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6576
claim: "2026-08-15T19:45:02Z"
assignee: "select-association-list-takes-joins-values-verbatim"
blocked-by: null
closed-reason: null
---

# `select_association_list` callers should pass `joins_values`, not a pre-filtered subset

## Context

Surfaced converging `apply_join_dependency` in PR #6573.

`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1810-1823`:

```ruby
def select_association_list(associations, stashed_joins = nil)
  result = []
  associations.each do |association|
    case association
    when Hash, Symbol, Array
      result << association
    when ActiveRecord::Associations::JoinDependency
      stashed_joins&.<< association
    else
      yield association if block_given?
    end
  end
  result
end
```

`finder_methods.rb:466-470` calls it with `joins_values` /
`left_outer_joins_values` verbatim; the `when Hash, Symbol, Array` arm is what
drops a raw-SQL `String` join.

trails' `selectAssociationList`
(`packages/activerecord/src/relation/query-methods.ts:2542`) ports that arm as
`typeof association === "string"`, because a Ruby Symbol is a JS string in
trails — so a raw SQL String is kept where Rails drops it. Every caller works
around this by pre-filtering with `_isNamedJoinValue` and passing
`_namedInnerJoins` (the filtered subset) instead of `joins_values`. PR #6573's
`applyJoinDependency` does the same and cites it in JSDoc.

## Converged shape

Move the named-vs-raw discriminator INTO `selectAssociationList`'s first `case`
arm — it is trails' spelling of Rails' `when Hash, Symbol, Array`, and it is
already the rule `joins()` applies at insert time (`Relation#_isNamedJoinValue`,
`relation.ts`). Callers then pass `joinsValues` / `leftOuterJoinsValues`
verbatim, as Rails does, and the `_namedInnerJoins` getter loses its
apply_join_dependency reader.

Watch: `selectNamedJoins` (query-methods.ts:2538) already hands it a filtered
list, so the change must be a no-op there.

## Acceptance criteria

- [ ] `selectAssociationList` drops a raw-SQL string join itself.
- [ ] `applyJoinDependency` / `_eagerJoinDependencyIsLimitable` pass
      `joinsValues` and `leftOuterJoinsValues`, and their `_namedInnerJoins`
      JSDoc deviation note is deleted.
- [ ] SQLite, PG, MySQL/MariaDB green; `pnpm parity:api:calls:args` non-regressed.
