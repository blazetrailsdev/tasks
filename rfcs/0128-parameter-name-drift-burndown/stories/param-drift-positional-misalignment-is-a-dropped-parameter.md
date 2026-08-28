---
title: "Parameter-name drift: the rows that are a DROPPED Rails parameter, not a rename"
status: draft
updated: 2026-08-28
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 220
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Most parameter-name rows are a rename. These eleven are not: the port dropped a
Rails parameter (or added one), the arity ranges still OVERLAP so the arity
check stays green, and every position after the gap lines up against its
neighbour — so one structural divergence is reported as a cascade of renames.
They are the highest-value findings the new check produced, and renaming the
parameters would BURY them.

`associations/alias_tracker.rb` is the clearest case
(`vendor/rails/activerecord/lib/active_record/associations/alias_tracker.rb`):

```text
alias_tracker.rb#create           @0  pool → initialTable
alias_tracker.rb#create           @1  initialTable → joins
alias_tracker.rb#create           @2  joins → aliases
alias_tracker.rb#create           @3  aliases → quoter
alias_tracker.rb#initial_count_for @0  connection → quoter
```

Four rows, one cause: the TS `create` has no leading `pool`. The same shape:

```text
base.rb#_create_record                    @0  attribute_names → block
abstract_adapter.rb#with_raw_connection   @0  allow_retry → optsOrCallback
abstract_adapter.rb#with_raw_connection   @1  materialize_transactions → callback
disable_joins_association_relation.rb#initialize @0  klass → key
disable_joins_association_relation.rb#initialize @1  key → ids
disable_joins_association_relation.rb#initialize @2  ids → chainWalker
```

`activerecord-test-support`'s `schema_dumping_helper.rb#dump_all_table_schema` is
a fourth variant — the two parameters are SWAPPED
(`ignore_tables, pool` in Rails, `pool, ignoreTables` in the port), which is the
one shape in this set that can be a live bug rather than a readability defect,
since a positional caller passes them the wrong way round.

## Acceptance criteria

- Each of the five methods carries Rails' parameter LIST — same parameters, same
  order, same defaults — verified against `vendor/rails` at the cited paths, and
  its parameters then carry the Rails identifiers camelCased.
- Where the port genuinely cannot take a Rails parameter (a `pool` the TS side
  reaches through another route), the deviation is justified AT THE CALL SITE
  per CLAUDE.md and the method's arity entry is reviewed — not left to read as a
  rename.
- Every caller of a changed signature is updated; `pnpm parity:api`,
  `parity:api:calls` and `parity:api:calls:args` show no new row, and the AR
  suite is green on all three lanes.
- The eleven rows are gone from `output/param-name-mismatches.json`.
