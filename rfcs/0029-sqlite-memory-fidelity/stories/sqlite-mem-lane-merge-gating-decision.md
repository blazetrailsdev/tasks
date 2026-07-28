---
title: "Decide whether sqlite-mem-tests should gate merges rather than only report on main"
status: ready
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5508 added the `sqlite-mem-tests` job (`.github/workflows/ci.yml`), which
runs the AR suite under `ARCONN=sqlite3_mem` — the only lane where
`inMemoryDb()` is true, and therefore the only thing keeping every
`skipIf(inMemoryDb())` guard from becoming dead code.

It is deliberately **not** in the `ci` aggregator's `needs:` list, and does not
run on ordinary PRs. It fires on `main`, on the Monday sweep, on
`workflow_dispatch`, and on a PR labelled `run-sqlite-mem`. The reasoning was
cost: it is a second full pass over the AR suite (~6 min on the verification
run, 550 files / 11327 tests) and CLAUDE.md is explicit that runner minutes and
review bandwidth are scarce.

The cost of that choice: a PR can merge a regression into this lane, and it
only surfaces red on `main` or up to a week later on the sweep, with no
attribution to the PR that caused it. #5508 itself demonstrated how easily the
lane rots — it had been unguarded long enough to accumulate 26 failures across
3 files, none of them noticed.

Verified behaviour (run 30370729030, the label applied to #5508): the `labeled`
event re-triggers CI, `changes` computes `activerecord_affected=true`, the `if`
clears, and the job runs green. So the mechanism works; only the gating
question is open.

## Acceptance criteria

- [ ] Decide whether `sqlite-mem-tests` should block merges.
- [ ] If yes: add it to the `ci` aggregator's `needs:` (ci.yml, the `ci:` job)
      AND add a skip-allowlist case in that job's "unexpectedly skipped" script
      conditioned on `AR_AFFECTED`, mirroring the existing
      `sqlite-tests|postgres-tests|maria-tests` case — without that case an
      unlabelled PR's legitimate skip fails the aggregate.
- [ ] If yes, also decide whether it runs on every AR-affecting PR (real cost)
      or stays label/main-only but blocking when it does run.
- [ ] Either way, update the `run-sqlite-mem` label comment at ci.yml:12-17,
      which currently documents the job as explicitly non-gating.
