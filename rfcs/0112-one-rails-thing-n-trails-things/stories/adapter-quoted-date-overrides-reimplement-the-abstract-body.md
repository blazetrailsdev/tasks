---
title: "Adapter quotedDate overrides reimplement the abstract body instead of refining super"
status: in-progress
updated: 2026-08-27
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7136
claim: "2026-08-27T20:13:47Z"
assignee: "sqlite-structure-load-in-memory-lane-decision"
blocked-by: null
closed-reason: null
---

## Context

Rails' `PostgreSQL::Quoting#quoted_date` is a two-line refinement of the
inherited one (`activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:143-150`):

    def quoted_date(value)
      if value.year <= 0
        bce_year = format("%04d", -value.year + 1)
        super.sub(/^-?\d+/, bce_year) + " BC"
      else
        super
      end
    end

`AbstractMysqlAdapter` and `SQLite3::Quoting` likewise either refine `super` or
do not override at all — the abstract body at `abstract/quoting.rb:184-199` is
the single place the `acts_like?(:time)` normalization and the `usec` fraction
are spelled.

trails' three overrides are full reimplementations that each re-enumerate the
whole Temporal branch set instead of calling the abstract one:
`connection-adapters/postgresql/quoting.ts:428-448`,
`connection-adapters/mysql/quoting.ts:219-250`,
`connection-adapters/sqlite3/quoting.ts:119-131` (the sqlite3 one is already a
bare `return abstractQuotedDate(value)`, so only its type signature duplicates).

Surfaced by #7101, which had to add the same `TimeWithZone` arm to three bodies
because there is no shared one — exactly the N-trails-things-for-one-Rails-thing
shape this RFC is about. The next value class added to `quotedDate` will cost
three edits again.

## Converged shape

- PG's `quotedDate` calls the abstract one and refines its result with the BC
  suffix, per `postgresql/quoting.rb:143-150`.
- MySQL's keeps only what is genuinely MySQL — Rails has no
  `AbstractMysqlAdapter#quoted_date` at all; the microsecond bound belongs in
  the formatter it shares, not in a parallel branch table.
- SQLite3's goes away entirely. Rails' `SQLite3::Quoting` declares no
  `quoted_date` at all (it overrides only `quoted_time`, sqlite3/quoting.rb:74),
  and once `AbstractMysqlAdapter`'s is gone the "give the inherited dispatch a
  receiver-local method to land on" reason its `@noRailsEquivalent CONVERGEABLE`
  cited is disproved — `AbstractAdapter#quotedDate` is that receiver. Deleting
  it is strictly more converged than keeping a pass-through that re-declares
  the parameter union.

## Acceptance criteria

- [ ] Each adapter `quotedDate` reaches the abstract body rather than
      re-enumerating the Temporal branches.
- [ ] Adding a value class to the abstract `quotedDate` requires no adapter edit.
- [ ] The PG BC-suffix and MySQL microsecond-bound behaviours are unchanged;
      `quoting.test.ts` and the three adapter quoting suites stay green.
