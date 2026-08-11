---
title: "converge-relation-where-clause-writer"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6371
claim: "2026-08-11T17:56:00Z"
assignee: "converge-relation-where-clause-writer"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `naming-burndown-ar-field-and-body-restructures` (PR for RFC 0096),
converging `or!` (`relation/query_methods.rb:1179-1190`) onto Rails' clause
readers.

Rails' `or!` writes through the CLAUSE_METHODS writers:

```ruby
self.where_clause = where_clause.or(other.where_clause)
self.having_clause = having_clause.or(other.having_clause)
```

`havingClause` on `Relation` already has both a getter and a setter
(`relation.ts:4371-4376`); `whereClause` has only a getter
(`relation.ts:4164-4166`), so `orBang` still assigns the private
`_whereClause` slot.

Adding the matching `set whereClause(value)` was tried and reverted: it turns
`whereClause` into a get/set ACCESSOR PAIR, and the TS extractor then stops
crediting a `whereClause` read as a call, so `pnpm parity:api:calls` went from
1449 to 1459 rows — 10 NEW call-set mismatches on bodies nobody touched:

```text
+ activerecord  relation.ts  exec_main_query        where_clause
+ activerecord  relation.ts  pluck                  where_clause  (x2)
+ activerecord  relation.ts  scope_for_create       where_clause
+ activerecord  relation.ts  where_values_hash      where_clause
+ activerecord  relation/merger.ts  merge_clauses   where_clause
+ activerecord  relation/query-methods.ts  build_arel        where_clause
+ activerecord  relation/finder-methods.ts  raise_record_not_found_exception!  where_clause
+ activerecord  persistence.ts  build_default_constraint          where_clause
+ activerecord  associations/preloader/through-association.ts  through_scope  where_clause
```

`havingClause` does NOT show the same symptom, so the classification is not
simply "accessor pair". Whichever the cause, a port cannot add a Rails writer
that Rails has without paying 10 baseline rows, which inverts the ratchet.

Note the same reading applies to every other CLAUSE_METHODS slot that is still
getter-only.

## Acceptance criteria

- [ ] Root-cause why a `get`+`set` pair on `Relation#whereClause` drops
      `whereClause` from the TS call population (`extract-ts-api.ts`,
      `callSiteName` / member classification), and why `havingClause` differs.
- [ ] Fix the extractor so an accessor pair is credited as a call exactly as a
      getter-only accessor is; `pnpm parity:api:calls` unchanged by the fix
      alone.
- [ ] Add `set whereClause(value)` to `relation.ts` (asserts modifiable, as
      `havingClause`'s writer does) and spell `or!` as
      `self.where_clause = where_clause.or(other.where_clause)`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no
      new baseline rows.
