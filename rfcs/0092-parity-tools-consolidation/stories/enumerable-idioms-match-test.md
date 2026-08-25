---
title: "Add match? → test to the comparator's enumerable-idioms alias table"
status: done
updated: 2026-08-08
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6256
claim: "2026-08-08T18:16:03Z"
assignee: "pg-adapter-test-aftereach-connect-hook-timeout"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/enumerable-idioms.ts` is the single source of truth for
Ruby idioms whose faithful port is a native JS method spelled differently. The
`parity:api:calls` triage audit of 2026-08-08 (activerecord's 1,146 unreviewed rows)
found `match?` to be the cleanest missing entry in that table: 28 activerecord
baseline rows are Ruby's `Regexp#match?` ported as JS `RegExp#test`, and 18 of
the 28 TS bodies were confirmed by script to contain `.test(`. One was
hand-checked end to end — `connection-adapters/column.ts#isBigint` spells
`/^bigint\b/i.test(this.sqlType)` for Rails' `/\Abigint\b/.match?`.

This is a convergence, not a reason: the rows leave the baseline by deletion
rather than by someone writing a justification for each. `test` also satisfies
the table's own guardrail, quoted in its header comment — "Each alias must be
the WHOLE call's analogue, never a building block". `RegExp#test` is exactly
and only what `Regexp#match?` means, so it cannot silence a dropped call the
way `min_by → reduce` would.

The table is package-agnostic: `compare.ts`'s call ratchet applies it to every
package in one pass, so the win is not confined to activerecord. Per the
table's header, "Aliases are consulted only to decide whether a TS body already
makes a call; they never widen which Ruby calls count as ported, so adding one
can never introduce a new mismatch" — the change can only shrink the baseline.

The mechanical consequence to plan for: the unreviewed high-water marks are
currently flush with zero slack (1,904 baselined = 1,904 marked). Rows
converging out of the baseline drops per-shard unreviewed counts below their
committed marks, which `unreviewed-ratchet.ts:slackByPath` gates as a
STALE-mark failure. The PR must therefore run `pnpm parity:api:calls:reseed` and
commit the resulting baseline and mark shards, not just the table edit.

Sibling story `positional-idiom-analogues` handles the harder half of the
audit's plan §1 (`first`/`last`/`any?`/`size`), which needs a different
mechanism; keep this one to the single uncontroversial pair so it can land on
its own.

## Acceptance criteria

- `["match?", ["test"]]` added to `JS_ENUMERABLE_ALIASES` in
  `scripts/api-compare/enumerable-idioms.ts`, with a comment recording why
  `test` is the whole call's analogue.
- A unit test covering the new pair alongside the existing table tests.
- `API_COMPARE_FORCE=1 pnpm parity:api --calls` run; the resulting
  `call-mismatches-exclude/` shrinkage is committed via
  `pnpm parity:api:calls:reseed` (never by hand-editing baseline JSON —
  `serializeBaseline` owns that encoding).
- `pnpm parity:api:calls` green with zero mark slack after the reseed.
- The PR body records the row count converged, split by package, so the
  cross-package leverage is measured rather than assumed.

## Audit addendum (auditor, 2026-08-08)

Confirming the scope is right, and one thing to expect when measuring.

`match?` has **no `Relation` homonym**, which is what separates it from the
`first`/`last`/`any?`/`size` half deferred to `positional-idiom-analogues` and
from the `except`/`merge!` rows corrected in `set-reason-bulk-mode`'s addendum.
`Regexp#match?` is the only `match?` in the population, so a global alias cannot
silence a dropped query trigger here. That is why this one can land alone.

**Expect fewer than 28 rows to converge.** Of the 28 activerecord rows, 18 TS
bodies contain `.test(`; the other 10 are a mix of extraction noise in the
audit's tooling and bodies that genuinely dropped the branch (e.g. the
`postgresql-adapter.ts#translate_exception` and
`join-dependency.ts#instantiate` rows, where the audit's body extractor grabbed
an adjacent type literal and the real body was never checked). Rows that do
**not** converge are the interesting output of this PR, not a shortfall: each
one is a `match?` Rails makes that the port does not, sitting in the baseline.
Listing them in the PR body — rather than only the converged count — hands the
next reader a pre-filtered candidate set of ~10 possible real gaps.
