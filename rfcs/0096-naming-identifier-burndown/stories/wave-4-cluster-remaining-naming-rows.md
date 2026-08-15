---
title: "Wave 4: cluster the 108 in-scope naming rows so the gate flip has a defined finish line"
status: done
updated: 2026-08-15
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6554
claim: "2026-08-15T00:40:23Z"
assignee: "wave-4-cluster-remaining-naming-rows"
blocked-by: null
closed-reason: null
---

# Wave 4: cluster the 108 in-scope naming rows so the gate flip has a defined finish line

## Context

Measured 2026-08-14 — full `pnpm build`, then
`API_COMPARE_FORCE=1 pnpm parity:api --calls` and
`pnpm parity:api:calls:args:report`.

The report totals **540 `kind: "args"` rows across 221 files**. Restricted to
this RFC's scope (`activerecord` and its dependencies) and to
`class: "naming"`, **108 rows survive across 73 files**. The taxonomy split
from `scripts/api-compare/naming-taxonomy.ts` puts roughly 34 of those in the
permanent classes (activerecord 19, activesupport 8, arel 5, i18n 2) and ~74 in
burndown classes.

RFC 0096's exit is `naming-gate-flip`, which is blocked on exactly this: "Flip
when the open wave-3 deps land and the report's permanent classes are all that
remain." The six open wave-3 stories name individual defects; they do not
account for 74 convergeable rows. **Nothing currently schedules the difference,
so the gate flip has no path to green.** This story closes that gap by turning
the remainder into claimable clusters.

Densest files (full list reproducible from the command above):

| File                                                     | Rows |
| -------------------------------------------------------- | ---- |
| `activerecord/connection-adapters/postgresql-adapter.ts` | 6    |
| `activerecord/relation/query-methods.ts`                 | 6    |
| `activesupport/cache/entry.ts`                           | 5    |
| `activerecord/connection-adapters/abstract-adapter.ts`   | 4    |
| `activerecord/associations/collection-association.ts`    | 3    |
| `i18n/backend/base.ts`                                   | 3    |
| 17 files with 2 each                                     | 34   |
| 50 files with 1 each                                     | 50   |

The shape is a long tail: 67 of 73 files carry 1–2 rows. That is the finding
that should drive the split — per-file stories would be 73 stories for 108
rows, which is why this is chartered as a clustering pass, not a fix-everything
pass.

A recurring pattern worth checking first, because it may retire a group at once:
several rows are `x -> x` (`quote_table_name -> quote_table_name` in
`arel/visitors/to-sql.ts`, `dst? -> dst?`, `unscoped -> unscoped`). A row where
the Ruby and TS names match textually is the classifier flagging a _receiver_ or
_arity_ difference rather than a spelling one — confirm whether these belong in
the naming class at all before spending convergence effort on them. If they are
misclassified, the fix is in `naming-taxonomy.ts` and it lowers the burndown
count without touching a single ported body.

## Acceptance criteria

- [ ] Every one of the 108 in-scope naming rows is assigned: to a named
      convergence cluster (filed as its own story with its row list), or to a
      permanent class in `naming-taxonomy.ts` with a stated reason.
- [ ] The `x -> x` rows are triaged first, and any misclassification is fixed in
      `naming-taxonomy.ts` rather than converged in the port.
- [ ] The output is a schedulable set of stories whose row counts sum to the
      measured burndown remainder, so `naming-gate-flip`'s precondition becomes
      checkable rather than a judgement call.
- [ ] The PR body restates the in-scope naming count from a fresh
      `pnpm parity:api:calls:args:report`, so the RFC's progress is measured and
      not asserted.
- [ ] No baseline is widened; `naming` stays report-only until the flip.

## Notes

This is a triage/clustering story: it produces stories, not port edits. Keep it
small — the convergence work belongs in the stories it files.
