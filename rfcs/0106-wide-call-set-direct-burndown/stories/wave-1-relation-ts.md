---
title: "Wave 1: relation.ts — 117 rows, the densest file in the population"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: 1
pr: 6558
claim: "2026-08-15T01:15:12Z"
assignee: "wave-1-relation-ts"
blocked-by: null
closed-reason: null
---

# Wave 1: relation.ts — 117 rows, the densest file in the population

## Context

Measured 2026-08-14 (full `pnpm build`, then
`API_COMPARE_FORCE=1 pnpm parity:api --calls`, counted over
`scripts/api-compare/call-mismatches-exclude/**` at `kind: "set"`).

`packages/activerecord/src/relation.ts` carries **117 of RFC 0106's 1,134
in-scope rows — 10.3% of the entire debt in one file.** No other file is close;
the runner-up (`relation/query-methods.ts`) has 46.

This is Wave 1 because the file is the single largest lever and because what it
teaches about the mechanism classes determines how Wave 4's tail sweep is
written.

## Answer the attribution question first

**This story's first deliverable is a measurement, not a diff.** RFC 0084's
re-measure (2026-08-04) found its association-cluster residual "still dominated
by `owner` / `reflection` / `klass` getter-shape rows" even after the
receiver-scoping fix landed (PR #4656), and projected 338 rows for `relation.ts`
against 143 measured. That gap suggests part of this file's count is cross-file
mixin attribution — `relation.ts` is the funnel that `include()`s
`query-methods.ts`, `finder-methods.ts`, `calculations.ts` and friends, so calls
made in a mixin can land against the funnel's row.

Before converging anything, report: **of the 117, how many name a method that is
actually defined in `relation.ts`, and how many belong to an included module?**
If a material share is attribution noise, the honest fix is in the extractor and
it belongs in a tooling story — converging 117 ported bodies to work around a
misattribution would be the wrong diff and would not survive the fix.

This is RFC 0106's Open Question 1. Resolving it here is what unblocks Wave 4
being filed.

## Then converge, by class, with receiver splits

Across the whole in-scope population the frequency head is:
enumerable/predicate 161 (`first` 44, `empty?` 38, `any?` 31, `include?` 16,
`last` 13, `size` 10), constructor `new` 44, `with_connection` 34, `fetch` 31,
homonym-risk 45 (`merge` 19, `delete` 11, `except` 10, `merge!` 5).
`relation.ts` is where the relation-receiver versions of these actually live, so
it carries the highest homonym density in the repo.

**The rule, non-negotiable in this file:** never act on a call name alone.
Measured 2026-08-08 over activerecord's unreviewed baseline, 7 of 95
`first`/`last`/`any?`/`size`/`include?` rows have a relation-ish receiver — but
`except` is 7 of 11 `Relation#except` and `merge!` is 3 of 4 `Relation#merge!`.
The contamination is per-name. `compare.ts:177-188` documents why these are
"DELIBERATELY NOT suppressed": on an Array they are plain JS idioms, on a
Relation they are query-triggering methods (`Relation#size` is
`loaded? ? records.length : count(:all)`; `#first`/`#last` route to
`find_nth_with_limit`/`find_last`). Join to the Ruby call site via
`output/rails-api.json` and split by receiver before writing any shared reason.
`match?` has no homonym and is safe.

## Acceptance criteria

- [ ] The attribution measurement above is reported in the PR body: how many of
      the 117 are own-file methods vs included-module methods, with the method
      names. If misattribution is material, a tooling story is filed for it
      **before** any body is edited to work around it.
- [ ] Every row converged is converged because the TS body now makes the call
      Rails makes — verified against the Ruby body, not inferred from the name.
- [ ] Any row that cannot converge carries a reviewed one-line reason or a
      `@missingRailsCall` tag at the call site. No class-wide reason is written
      without the receiver split that justifies it.
- [ ] Rows are deleted **by hand** from their shard; stale high-water marks
      fixed with `pnpm parity:api:calls:tighten activerecord/relation.json`.
      No `--write`, no reseed — a reseed rewrites the whole exclude tree and
      buries the rows in an unreviewable diff.
- [ ] `pnpm parity:api:calls` green; in-scope row count drops from 1,134 by the
      number converged and does not rise.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Notes

117 rows will not fit one PR at the LOC ceiling. Land the attribution
measurement plus the first slice, then file the remaining slices as their own
stories (split by method family, not by row count) rather than fanning out PRs
from this claim.
