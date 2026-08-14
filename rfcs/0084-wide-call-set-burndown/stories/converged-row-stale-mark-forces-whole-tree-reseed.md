---
title: "Converging a call-set row forces the whole-tree reseed CLAUDE.md forbids; give the stale mark a narrow remedy"
status: done
updated: 2026-08-14
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 1
pr: 6506
claim: "2026-08-14T01:57:12Z"
assignee: "converged-row-stale-mark-forces-whole-tree-reseed"
blocked-by: null
closed-reason: null
---

## Context

The call-set gate's unreviewed high-water mark and the exclude baseline have
contradictory remedies, and the contradiction penalises convergence.

Observed on PR #6459. Converging `insert_all.rb:170` (`unique_indexes` reading
`model.table_name`) retired two rows from
`scripts/api-compare/call-mismatches-exclude/activerecord/insert-all.json`. Those
were deleted by hand via `serializeBaseline`, as CLAUDE.md requires. `pnpm
parity:api:calls` then failed:

```text
call-mismatches unreviewed ratchet: STALE high-water mark — 1 file(s) under
scripts/api-compare/call-mismatches-unreviewed/ claim more unreviewed entr(ies)
than the baseline still carries (2 of slack).
  pnpm parity:api:calls:reseed
  - activerecord/insert-all.json  mark 9, only 7 unreviewed
```

The **only** sanctioned remedy the gate offers is
`parity:api:calls:reseed`, which is
`API_COMPARE_FORCE=1 pnpm parity:api --calls && lint-call-mismatches.ts --write`.
That `--write` rewrites **the whole exclude tree** (1668 rows) _and_ all 328
marks — precisely the operation CLAUDE.md forbids two paragraphs earlier:

> Do **not** `--write`/reseed — a reseed rewrites the whole exclude tree and
> buries the one row you meant to retire in an unreviewable diff.

So an agent who converges a real divergence is told to delete its baseline row
by hand, and is then told the only way to clear the resulting stale mark is the
reseed they were just forbidden from running. On #6459 the net diff happened to
be one mark file, but that is luck: any concurrently-drifted row anywhere in the
tree would have been swept into an unrelated PR silently.

The mark is described as only-shrink, so tightening one file's mark is always
safe and needs no whole-tree regeneration.

## Acceptance criteria

- [ ] Converging a call-set row and deleting its baseline entry by hand leaves
      `pnpm parity:api:calls` green without any whole-tree reseed — either the
      mark gate accepts a mark that exceeds the surviving count (it is a
      high-water mark, so slack is not drift), or a narrow
      `--tighten [<file>...]` writes only the affected mark files.
- [ ] `parity:api:calls:reseed` keeps working for genuine reseeds but is no
      longer the advice printed for a stale-mark-after-convergence failure; the
      message names the narrow remedy instead.
- [ ] CLAUDE.md's "Converged something?" paragraph and CONTRIBUTING.md describe
      the narrow remedy, so the no-reseed rule and the gate's advice agree.
- [ ] A regression test covers: delete one baselined row, assert the gate is
      green with no other file modified.
