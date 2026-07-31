---
title: "defer-pg-maria-suites-on-draft-prs"
status: done
updated: 2026-07-31
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5749
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured over 400 `pull_request` CI runs / 106 branches / 100 merged PRs in a
29.5 h window (2026-07-30T14:22Z → 2026-07-31T19:54Z, `gh run list` +
`actions/runs/$ID/jobs`):

- The five AR DB jobs are **64.5%** of all CI burn (7,088 of 10,986 job-min).
- **56.8%** of burn is non-final runs; **62.5%** of that is runs killed
  mid-flight by a later push, not failures.
- **59%** of those supersessions had a btwhooks review land in the window, and
  the superseding push follows the review by a **median 6 seconds** — 2,385
  wasted minutes, 21% of all burn.

The review trigger is moving from the ready-flip to pre-ready, so draft PRs
become the iteration phase. Deferring the four PG/MariaDB runners past that
phase is the largest coverage-neutral saving available (~9,000 job-min/week).

Coverage moves in **time, not extent**: `postgres-tests` / `maria-tests` stay
in the `ci` aggregator's `needs:`, and `ci` is the branch-protection target, so
nothing merges without them. SQLite still runs on every push.

This is a narrower successor to the closed `label-gate-ar-db-matrix` story
(closed 2026-07-25, "user declined all of them") — that one deferred PG/MariaDB
coverage to _post-merge_, which was the stated objection. This one defers it to
ready-for-review, still strictly pre-merge.

## Acceptance criteria

- [x] `ready_for_review` added to `on.pull_request.types` (without it the
      draft → ready transition starts nothing and a ready PR could sit with no
      adapter coverage).
- [x] `changes` emits `db_adapter_affected` from a `DB_ADAPTER_RE` covering
      both adapter source trees, Arel's per-backend visitors, the CLI per-adapter
      E2E suites, and the shared `connection-adapters/abstract/` substrate.
- [x] `postgres-tests` / `maria-tests` skip on draft PRs unless
      `db_adapter_affected` or the `run-db-adapters` label opts them back in.
- [x] Push to `main` / schedule / `workflow_dispatch` unchanged (all adapters).
- [x] `ci` aggregate learns the new legitimate skip via
      `DB_ADAPTERS_DRAFT_DEFERRED` — no skipped-but-required wedge.
- [x] Regression test in `scripts/ci-suite-coverage.test.ts` pinning
      `db_adapter_affected` in both directions; fails on baseline `main`
      (the output does not exist there).

## Follow-ups (not this PR)

- Re-measure draft-share of burn once the review trigger has actually moved;
  the 32.5% draft figure was taken while the median draft phase was 3.0 min.
- The other 41% of supersessions are self-directed pushes — separate lever.
