---
title: "Re-measure RFC 0130's remaining phase inventories and drop absolute counts from their acceptance criteria"
status: draft
updated: 2026-09-05
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0130's per-phase story bodies each carry a **name inventory measured
2026-08-30** (the RFC's own "Measured 2026-08-30 against a forced `parity:api`
run"). Those inventories go stale as sibling PRs converge names by route 1, and
the story bodies are never re-measured at claim time.

Demonstrated on `receipt-associations-and-join-dependency` (PR #7516, merged
2026-09-05): its body claimed **29 novel names across 10 files**; the actual
measurement at claim time was **22 across 9**. The 7-name gap was three
already-merged sibling convergences —

- `associations/validate-through-reflection.ts` (4) — deleted by #7372
  (2026-09-01), folded into `Association#initialize` per
  `activerecord/lib/active_record/associations/association.rb:42`;
- `associations/join-dependency.ts`'s `columnsForNode` / `selectArel` (2) —
  converged by #7435 (2026-09-03) onto `JoinDependency::Aliases`;
- `associations/new-owner-seed-rebase.ts` counted 2 where the tool reports 1
  (`Rebaseable` is a non-exported `interface`, exempt since #5664) — a plain
  arithmetic slip in the census, not drift.

This cost a **blocking review finding** ("story asks for 29, PR resolves only
22 — acceptance criteria unmet") and a full reconciliation round, because the
story's acceptance criteria name an absolute count that the tool no longer
agrees with.

Two phases still carry unrefreshed 2026-08-30 inventories, and they are the two
largest: `receipt-encryption-and-type-virtualization` (200 loc) and
`receipt-package-root-base-fixtures-enum-errors` (450 loc, 107 names at the
package root). Both will drift the same way.

## Acceptance criteria

- Each remaining RFC 0130 phase story's `## Context` inventory is re-measured
  with `pnpm parity:api:extra --package activerecord --novel-only` and corrected
  by PR against the tasks repo.
- Each phase's acceptance criteria stop naming an absolute count and instead
  state the invariant that actually holds across sibling merges: "`<dir>/`
  reports 0 novel and the mark is tightened in the same PR". The absolute is
  the census's, not the work's.
- The RFC's own `## Design` table is annotated with the census date already in
  it, so a later reader knows the numbers are a snapshot rather than a target.
