---
title: "Preflight failure halts the whole CI run"
status: draft
updated: 2026-09-03
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`.github/workflows/ci.yml:398` defines the `Preflight` job — the consolidated
sub-minute checks (Prettier, raw control bytes, sync-association-writer
verification, docs-AR freeze, PR attribution, …). It `needs: changes` only, and
nothing needs it: every other job in the file also hangs off `changes`
(`grep -n 'needs: changes' .github/workflows/ci.yml` — ~25 jobs). Its failure is
only observed at the end, by the `ci` aggregator (`ci.yml:1938`), whose
`if: ${{ always() }}` step greps `needs` for `result == "failure"`.

Consequence: a PR that fails Prettier — a fix that takes one `pnpm format` and a
push — still burns the entire matrix. The adapter lanes (sqlite / postgres /
maria), the parity pipeline jobs, and the comparison job all run to completion
against a diff that is already known-red. RFC 0028's own measurements put the
adapter jobs at ~24 billed minutes of a ~48-minute full run, so a trivially-red
preflight costs roughly a full run's worth of billed minutes and the author
waits the full wall-clock before seeing a 5-second failure.

## Design

Make `preflight` a **barrier**: every job that currently reads `needs: changes`
reads `needs: [changes, preflight]` instead. GitHub skips a job whose `needs`
failed, so a red preflight stops the run at ~1 minute with nothing else
started, and the `ci` aggregator still fails (skipped-with-failed-dependency is
caught by its unexpected-skip arm — which will need a matching update, see
below).

Cost of the barrier: preflight is added to the critical path of every job, so
time-to-green grows by preflight's wall time (checkout at `fetch-depth: 0` +
setup-node + ~25s of checks). Measure it on a few recent runs before landing; if
it is materially more than ~1 minute, trim the barrier to the expensive jobs
only (the adapter lanes and the parity pipeline) and leave the cheap ones on
`changes`, which captures nearly all of the savings.

Alternatives considered, to be settled in the PR:

- **Cancel rather than gate.** Keep the `needs:` graph as-is and have preflight,
  on failure, call the Actions API to cancel the in-progress run. Faster to
  green in the common case (no added critical path) but leaves the run's other
  jobs recorded as `cancelled`, which the `ci` aggregator currently treats as a
  hard failure — legible, but noisier, and it depends on `actions: write`.
- **`fail-fast` semantics via the aggregator** — not available; `needs:` is the
  only ordering primitive.

Either way the aggregator's skip allowlist at `ci.yml:2021` needs revisiting:
its `preflight)` arm documents "a whole-job skip only happens if `changes`
itself failed", and the downstream arms assume a skip means a gate said no, not
that a dependency went red. Under the barrier, a red preflight skips ~25 jobs
and every one must stay a failure, not a legitimate skip.

## Acceptance criteria

- A PR whose only defect is a Prettier violation runs `changes` + `preflight`
  and nothing else; no adapter lane, parity job, or comparison job starts.
- `ci` still reports failure for that run, via the failed `preflight` and not
  via a mis-classified skip.
- The aggregator's unexpected-skip allowlist is updated so a skip caused by a
  failed `preflight` is never treated as legitimate.
- A green PR's job graph is otherwise unchanged; measure and record the added
  critical-path time in the PR body.
