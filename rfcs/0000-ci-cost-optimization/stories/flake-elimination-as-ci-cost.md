---
title: "Attack the top shared-table flakes as a direct CI-cost line"
status: draft
updated: 2026-06-15
rfc: "0000-ci-cost-optimization"
cluster: flake-cost
deps: []
deps-rfc:
  - "0019-canonical-schema-burndown"
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A flaky job re-run re-bills the **entire** job. For the AR adapter suites that
is 6–10 billed minutes per rerun. The conclusion mix over the last 200 runs is
**17.5% failure**, an unmeasured slice of which is known shared-table flakes
rather than real regressions. Repo memory documents recurring offenders:
`date.test.ts` + `attribute-methods.test.ts` (PG), the `items` table collision
(`errors.test.ts` vs `readonly.test.ts`), the `posts` table collision
(`extension.test.ts` vs ~14 title-only schemas), and the `dirty` people-table PG
collision. Each is a parallel-fork shared-table collision under the 8-fork AR
runs.

This story treats flake elimination as a **cost** measure: every avoided rerun
is 6–10 billed minutes (plus the agent latency of a red run). It is the
cost-framing companion to RFC 0019 (canonical-schema burndown), which owns the
structural fix.

## Acceptance criteria

- [ ] Quantify the flake-rerun cost: over a recent window (e.g. last 200 runs)
      count AR-job failures that pass on rerun without a code change, and
      estimate billed minutes lost. Record in the PR description.
- [ ] Fix (or file under RFC 0019) the **top 2–3** shared-table collisions by
      ROI, using the canonical-rebuild pattern already proven in the repo
      (`beforeAll` dropExisting canonical rebuild, mirroring
      `locking.test.ts`/`dirty.test.ts` shields) — **not** by renaming tests
      (test names are matched against Rails) and **not** by inventing tables.
- [ ] CI green; the targeted collisions no longer reproduce across repeated
      runs (demonstrate with a few reruns of the affected files).

## Savings & risk

- **Est. savings:** variable but recurring — each eliminated flake removes its
  rerun's 6–10 billed min at the flake's hit rate. Even a couple of flakes at a
  few percent hit rate across ~370 runs/day is a meaningful recurring line.
- **Risk:** medium. Touching test setup risks perturbing the shared signature
  cache / scheduling (see repo memory on bespoke-handler-table flakes). Prefer
  riding the canonical table Rails uses; fall back to `afterAll(dropAllTables)`.
  Fidelity first: never adjust a test name or invent a schema to dodge a
  collision.

## Notes

This story may be **larger than one PR** if more than ~2–3 collisions are in
scope. If so, fix the highest-ROI collision here and register the rest as RFC
0019 stories with `pnpm tasks new 0019-canonical-schema-burndown <slug>` — do
not fan out sibling PRs from this story.
