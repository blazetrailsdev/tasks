---
title: "A multi-value `when` reads as one arm against every faithful TS lowering"
status: draft
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`skeleton-emits-one-arm-per-when-elsif-and-rescue-clause` (#7526) made a Ruby
`case` emit one `if` per `when` CLAUSE and a TS `switch` emit one per
`CaseClause`, which cleared row 77 of the noise-floor sample. It did not clear
rows 34, 53, 60 or 74, and re-checking each showed why: those are not
multi-`when` `case`s at all. They are a single `when` carrying several VALUES.

Ruby's canonical shape is
`activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:272-274`:

```ruby
case size&.to_s
when nil, "tiny", "medium", "long"
  "#{size}#{type}"
else
  raise ArgumentError, …
end
```

One `when` clause, four `===` tests, and — correctly — ONE arm. Its faithful TS
port has no single-clause spelling: it is either four `CaseClause`s falling
through to one body, or `if (size == null || s === "tiny" || s === "medium" ||
s === "long")`, or `if (["tiny", "medium", "long"].includes(s))`. The first
spells four arms after #7526; the second spells four (three `||` tokens plus
the `if`, via `isSkeletonLogicalOp`); the third spells one plus a `ref:includes`
reach. So the same Ruby clause reads as 1 against 4, 4 or 1 depending only on
which faithful lowering the port picked.

Confirmed instances in the sample: rows 34
(`activesupport core-ext/hash/conversions.ts#processHash`), 53
(`activerecord …/postgresql/oid/date-time.ts#castValue`), 60
(`activerecord relation/query-methods.ts#reverseSqlOrder`), 74
(`activerecord …/mysql/schema-statements.ts#typeWithSizeToSql`), recorded in
the addendum to `docs/infrastructure/arm-mismatch-noise-floor.md`. This is what
is left of the `case`-lowering artefact class after #7526, and it is the
largest single class the class-by-class re-check found still standing.

Ruby side (`extract-ruby-api.rb#walk_for_skeleton`, `SKELETON_IF_NODES` at
`:2708`): a `:when` node's slot 1 is its value LIST, so the clause's value
count is available where the `if` is pushed today.

TS side (`extract-ts-api.ts#extractSkeleton`): consecutive `CaseClause`s with an
empty `statements` list are one Ruby clause, not N; and a chain of `||`
comparisons against one subject inside a single `if` is likewise one clause.

## Acceptance criteria

- [ ] A Ruby `when` with N values and its TS ports agree on the arm count,
      whichever of the three faithful lowerings the port chose.
- [ ] Consecutive TS `CaseClause`s that share one body (empty `statements`)
      contribute one arm between them, matching Ruby's one `when`.
- [ ] Decide and document — in the extractor doc comments, as #7526 did —
      whether the shared count is 1 (the Ruby clause count) or N (the value
      count), and make BOTH extractors emit it; a `||` chain over one subject
      inside an `if` must land on the same number.
- [ ] Unit tests on both extractors pinning `schema_statements.rb:272-274`
      against all three of its faithful ports.
- [ ] `pnpm parity:api:arms:report` before/after row count in the PR body; rows
      34, 53, 60 and 74 no longer report for this reason.
- [ ] Nothing new gates; `report-arms.ts` stays report-only.
