---
title: "merge-clauses-where-clause-structure"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6468
claim: "2026-08-13T15:19:07Z"
assignee: "merge-clauses-where-clause-structure"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by RFC 0096 wave 3 (`naming-burndown-3-ar-persistence-relation`). The
`call-arg-mismatches` row for `relation/merger.ts#mergeClauses` is a
**structural (a3)** divergence, not a naming one, so the burndown story left it
standing.

Rails `vendor/rails/activerecord/lib/active_record/relation/merger.rb:176-184`:

```ruby
def merge_clauses
  relation.from_clause = other.from_clause if replace_from_clause?

  where_clause = relation.where_clause.merge(other.where_clause)
  relation.where_clause = where_clause unless where_clause.empty?

  having_clause = relation.having_clause.merge(other.having_clause)
  relation.having_clause = having_clause unless having_clause.empty?
end
```

trails `packages/activerecord/src/relation/merger.ts:271-278` does the having
merge FIRST, the from-clause replacement SECOND, and **omits the where-clause
merge entirely** — where merging happens on another path in the port. Rails also
guards on the MERGED clause being empty; trails guards on `other`'s clause being
empty, which is a different predicate.

Recorded row:

```text
relation/merger.ts | mergeClauses | merge
  RUBY[ref:whereClause]  TS[ref:_havingClause]
```

Verify whether the separate where-merge path is equivalent (in particular for
`merge(unscope(:where))` and for an `other` with an empty where clause but a
non-empty receiver), then either fold the where merge back into `mergeClauses`
in Rails' order, or document why it cannot live there.

## Acceptance criteria

- [ ] `mergeClauses` performs the from-clause replacement, the where-clause
      merge and the having-clause merge, in Rails' order and with Rails' empty
      guards — or the deviation carries a call-site justification naming the
      trails path that does the where merge.
- [ ] The `mergeClauses` row no longer appears in
      `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report`.
- [ ] `relation/merging` tests pass on all three adapters.
