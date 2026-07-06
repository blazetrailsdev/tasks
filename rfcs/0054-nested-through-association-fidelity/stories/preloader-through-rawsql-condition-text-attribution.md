---
title: "Through-preload raw-SQL condition relocation uses a text qualifier scan (string-literal false-positive)"
status: ready
updated: 2026-07-06
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3932 (story `a1-eager-sti-through`) taught the through-association
preloader to relocate a raw-SQL WHERE condition that references the through
table onto the through query, so `Member#favorite_club`
(`where("memberships.favorite = ?", true)`, member.rb:10) preloads instead of
raising `no such column: memberships.favorite`.

The relocation decision lives in
`packages/activerecord/src/associations/preloader/through-association.ts`:
`predicateReferencesTable` now calls `rawSqlReferencesTable`, which scans the
raw SQL text of a `SqlLiteral`/`BoundSqlLiteral` (through one `Grouping`
wrapper) for a `(^|[^\w.])<table>\.` qualifier. This is a **heuristic text
scan, not a SQL parse**: a `<table>.` qualifier embedded in a string literal —
e.g. `where("note = 'see memberships.x'")` — would be a false positive and
relocate a source-table predicate onto the through query. No current scope hits
this; raw-SQL through conditions in the canonical models are simple
table-qualified comparisons.

Root cause is the broader trails deviation from Rails: Rails' `through_scope`
(`vendor/rails/.../preloader/through_association.rb`) copies the _entire_
`reflection_scope.where_clause` onto the through query and `joins!` the source
so both through- and source-table columns resolve in one query. trails instead
runs a two-step preload (through, then source) and splits the where_clause by
referenced table (`_partitionReflectionWhere`), which is what forces the
text-based table-attribution in the first place.

## Acceptance criteria

- [ ] Decide whether to (a) make the raw-SQL attribution robust (parse/strip
      string literals before scanning, or attribute via Arel nodes only), or
      (b) converge the through-preload to Rails' single-query JOIN so no
      text-based relocation is needed.
- [ ] If keeping the heuristic, add a test exercising a `<table>.`-qualifier
      inside a string literal to pin the chosen behavior.
- [ ] No regression in the four `a1-eager-sti-through` tests or the existing
      hash/Arel through-condition relocation tests.
