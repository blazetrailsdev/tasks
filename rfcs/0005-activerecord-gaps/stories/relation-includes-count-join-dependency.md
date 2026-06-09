---
title: 'Relation: count and count("*") with includes must apply join dependency'
status: draft
updated: 2026-06-09
rfc: "0005-activerecord-gaps"
cluster: relation
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced post-merge during #2970 (Track 9 association-gap un-skips). Two count
paths skip the eager-load JOIN that Rails applies via `apply_join_dependency`:

1. **`count("*")` with plain includes skips the JOIN.** `hasInclude`
   (`packages/activerecord/src/relation/calculations.ts:764`) excludes both
   `"all"` and `"*"`:
   `columnName != null && columnName !== "all" && columnName !== "*"`. Rails only
   excludes the `:all` symbol (`calculations.rb:94`), so an explicit `count("*")`
   satisfies `column_name && column_name != :all` and routes through
   `apply_join_dependency`. `Post.includes("comments").count("*")` adds the JOIN in
   Rails but skips it in trails.

2. **Grouped count + eager load skips the join dependency.**
   `group(...).eagerLoad(...).count()` returns early through `groupedAggregate`
   (`calculations.ts:366`, `performCount`) before any `hasInclude` check. The
   inline comment at `calculations.ts:368` claims the grouped path "runs the check
   itself," but `groupedAggregate` (`calculations.ts:312`) has no `hasInclude`
   guard or join-dependency promotion — verified against current `main`. Rails
   checks `has_include?` first (`calculations.rb:231`), then recurses into the
   grouped calculation on the joined relation (`calculations.rb:454`).

Both are genuine query-shape divergences. No Rails-mirrored test currently fails
on them (the #2970 un-skips happened to avoid these shapes); add coverage.

## Acceptance criteria

- `hasInclude` no longer excludes `"*"` — only the `:all`/`"all"` sentinel is
  excluded, matching `calculations.rb:94`.
- `performCount`'s grouped early-return checks `hasInclude` first and, when true,
  builds the join-dependency relation before delegating to `groupedAggregate`
  (mirror `calculations.rb:231`/`:454`).
- Fix the stale `calculations.ts:368` comment, which currently misdescribes
  `groupedAggregate` as running the `hasInclude` check.
- Add tests for `Post.includes("comments").count("*")` and
  `group(...).eagerLoad(...).count()` asserting the LEFT OUTER JOIN + DISTINCT-on-PK
  fan-out guard is emitted.
