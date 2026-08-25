---
title: "Decide whether draft PRs keep the db_adapter_affected PG/MariaDB opt-in"
status: closed
updated: 2026-08-08
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do on RFC closure: 0028-ci-cost-optimization is being closed at 71/77 and no other RFC owns CI cost policy. The open question — whether draft PRs keep the db_adapter_affected PG/MariaDB opt-in (ci.yml:1080-1087 postgres-tests, ci.yml:1331-1341 maria-tests, both deferring to ready_for_review) — is unanswered, not answered in the negative. Status quo stands; the pre-ready CI audit from #5931 has the full analysis. Refile if draft-PR adapter coverage causes a miss."
---

## Context

Surfaced by the pre-ready CI audit shipped in #5931 (report:
`~/.btwhooks/data/github/blazetrailsdev/trails/audits/pre-ready-ci-deferral-20260802T231228Z.md`).

`postgres-tests` (`ci.yml:1080-1087`) and `maria-tests` (`ci.yml:1331-1341`)
defer to `ready_for_review` on drafts, but `db_adapter_affected` opts a draft
back IN. `DB_ADAPTER_RE` (`ci.yml:130`) is broad — `abstract/`,
`abstract-adapter.ts`, `column.ts`, `adapter-args.ts`, `sql-classification.ts`,
`pool`, plus the PG/MySQL-named trees and the arel PG/MySQL visitors — which is
exactly the substrate the ongoing convergence work touches.

Measured: 4 matrix legs (2 shards x 2 adapters) at 386-566s each, ~34
runner-minutes, fired on **5 / 30 (17%)** of recent merged PRs (replayed
`DB_ADAPTER_RE` against `gh pr diff --name-only`). It is the largest remaining
deferrable pre-ready cost by an order of magnitude.

Against it: adapter PRs are exactly where a green SQLite run means least, so
removing the early signal risks a post-review fix commit plus a second full
ready-phase run, which could erase the saving. The carve-out's own comment
(`ci.yml:124-127`) frames a false negative as "costs a later signal, never
coverage", i.e. it was built as an early-signal nicety — so this is a judgment
call, not a mechanical one. Filed NEEDS-DISCUSSION by the audit rather than
implemented.

Related: `re-measure-draft-burn-after-review-trigger-move` (measurement),
`create-run-db-adapters-label` (the opt-in label does not exist on the repo yet).

**Left `draft` deliberately by the 2026-08-07 backlog sweep.** Every other 0028
draft was readied; this one was not, and that is the finding, not an oversight.
The audit filed it NEEDS-DISCUSSION and the body says so — "this is a judgment
call, not a mechanical one". Both outcomes below are defensible from the same
measurements, so an agent claiming it would be making a CI-policy call on the
user's behalf rather than executing a decision. Promote it to `ready` only
after the decision in AC-1 has actually been taken by a human; the implementation
half (AC-2/AC-3) is mechanical once it has.

## Acceptance criteria

- A decision is recorded (in this story) on whether draft PRs keep the
  `db_adapter_affected` opt-in.
- If removed: drop the `db_adapter_affected` disjunct from both jobs' `if:`,
  keep `run-db-adapters` as the manual escape hatch, invert the matching clause
  out of `DB_ADAPTERS_DRAFT_DEFERRED` (`ci.yml:1881`), and update the
  bidirectional pin in `scripts/ci-suite-coverage.test.ts` ("keeps the draft
  deferral, its two jobs and the ci aggregate in agreement").
- If kept: narrow `DB_ADAPTER_RE` instead, or close with the rationale so the
  audit finding is not re-derived.
