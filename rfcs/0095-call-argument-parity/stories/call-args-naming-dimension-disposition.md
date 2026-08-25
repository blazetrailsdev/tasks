---
title: "Decide the disposition of the call-argument naming dimension"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: ["call-args-artifact-and-report"]
deps-rfc: []
est-loc: null
priority: null
pr: 6334
claim: "2026-08-10T12:55:18Z"
assignee: "call-args-naming-dimension-disposition"
blocked-by: null
closed-reason: null
---

## Context

The RFC 0025 `## Call-argument fidelity` spike (2026-08-08) recommended
splitting the new dimension into two row classes and gating only one:

- `shape` rows — argument count, order, literal values, kwarg keys. Gated by
  `call-args-ratchet-and-ci-step`.
- `naming` rows — argument lists that differ **only** in a `ref:` identifier
  spelling. Report-only, and this story is their owner.

Measured: `naming` is ~33% of arel's flagged population and ~31% of the
activerecord sample — roughly 500 rows across the two packages, all classified
(a) genuine in the spike's hand classification. Examples:
`o`→`node`, `x`→`n`, `v`→`h`, `join_name`→`tbl`, `values`→`row`,
`exprs`→`filtered`, `scope_for_association`→`sfa`, `relation`→`tableNode`.

Every one is a CLAUDE.md violation — "A local or parameter keeps the Rails
identifier, camelCased — Ruby `stmt` is `stmt`, not `statement`; `klass` is
`klass`, not `modelClass`. This is free fidelity and it is most of what makes a
body readable next to the Ruby." They are individually low-severity and
mechanically fixable, which is exactly why they are worth burning down in bulk
rather than one-at-a-time inside unrelated PRs.

They are deliberately **not** gated on day one: 500 seeded rows would swamp the
`shape` baseline that carries the findings nothing else can see, and this is
really the local/parameter-identifier dimension surfacing through the argument
comparison rather than an argument defect as such.

The decision this story exists to force: does the naming dimension get a
burndown campaign of its own, and does it eventually gate?

## Acceptance criteria

1. Run `pnpm parity:api:calls:args --report` (once `call-args-artifact-and-report`
   lands) over every compared package and record the true `naming` row count —
   the ~500 figure is extrapolated from arel's full population plus a 32-row
   activerecord sample, not measured at scale.
2. Group the rows by cause and report the distribution: single-letter Rails
   locals kept vs renamed, abbreviations (`sfa`, `tbl`, `dist`), and
   Rails-name→descriptive-name rewrites (`klass`→`modelClass` class). The
   spike's classification is the starting taxonomy.
3. Sample n≥30 and confirm the (a)-genuine rate holds at scale — the spike
   classified this class as 100% genuine, but only over ~35 rows total.
4. Decide and record in RFC 0025: burndown campaign (and under which RFC — a
   500-row mechanical rename campaign may warrant its own), or permanent
   report-only, or gate-with-seeded-baseline. A decision either way closes this
   story; leaving it report-only by default does not.
5. If the verdict is a campaign, file it as bundle-sized stories with
   non-overlapping files — a repo-wide identifier rename touching every visitor
   and relation file at once is exactly the shape that conflicts with every
   sibling agent.
