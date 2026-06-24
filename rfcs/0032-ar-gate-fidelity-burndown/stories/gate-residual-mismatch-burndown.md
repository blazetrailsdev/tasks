---
title: "gate-residual-mismatch-burndown"
status: blocked
updated: 2026-06-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: "2026-06-20T23:58:46Z"
assignee: "gate-residual-mismatch-burndown"
blocked-by: "Agent orphaned by host OOM 2026-06-24 17:47 EDT; releasing claim for re-pickup"
---

## Context

RFC `0032-ar-gate-fidelity-burndown`, cluster `wrong-gate` / `should-gate`
residual. The four burndown clusters (`missing-gate`, `wrong-gate`,
`over-gated`, `should-gate`) are marked done, but a fresh
`pnpm test:compare --package activerecord --gates` against `origin/main`
(verified 2026-06-20, at e16dbed49) still reports **17** activerecord
gate-mismatches. These block the `gate-mismatch-zero-ci-enforcement` story,
which cannot arm the hard-zero CI gate until the count reads zero (arming
sooner turns CI red).

Residual mismatches (Rails gate vs our TS gate), as classified by
`scripts/test-compare/gates.ts` (`classifyGateMismatch`):

**wrong-gate (16)** — both sides gate, but to different adapter/feature sets:

- `changing columns`
- `changing column null with default`
- `default functions on columns`
- `upsert all works with partitioned indexes`
- `advisory locks enabled?`
- `schema dump expression indices escaping`
- `partial insert off with changed composite identity primary key attribute`
- `migrate revert add check constraint with invalid option`
- `passing arbitrary flags to adapter`
- `passing flags by array to adapter`
- `insert record`
- `insert record populates primary key`
- `read uncommitted`
- `read committed`
- `repeatable read`
- `serializable`

**should-gate (1)** — Rails gates it, we `it.skip` it as a TODO (no gate):

- `doesnt error when a select query has encoding errors`

For each, read the corresponding Rails test first to determine the correct
adapter/feature condition, then converge our TS gate to match Rails exactly
(fidelity-first; never reword the test name). The four transaction-isolation
names (`read uncommitted` / `read committed` / `repeatable read` /
`serializable`) likely share one root cause — Rails gates them on
`supports_transaction_isolation?` while our TS gates them to a different
adapter set; converge together.

Locate each with:
`pnpm test:compare --package activerecord --gates` (the GATE MISMATCHES
section prints `rails:` and `ts:` gates per test alongside the convention TS
file).

## Acceptance criteria

- [ ] `pnpm test:compare --package activerecord --gates` reports **0**
      gate-mismatches for activerecord (the `convention-comparison.json`
      `totalGateMismatch` for the activerecord package is 0).
- [ ] Each of the 17 tests above has its TS adapter/feature gate converged to
      Rails' actual condition (read the Rails test; do not rename our test).
- [ ] No test names changed; no `it.skip` left where Rails actually runs the
      test gated (the should-gate case gets a real gate, not an un-skip that
      runs everywhere).
- [ ] Unblocks `gate-mismatch-zero-ci-enforcement`.

## Notes

If the residual exceeds one 500-LOC PR, ship the portion that fits and register
the remainder as a further story rather than fanning out PRs. The
`gate-mismatch-zero-ci-enforcement` story carries an already-implemented
`--check` exit-code path (`scripts/test-compare/test-compare.ts --gates
--check`) waiting to be wired into CI once this reaches zero.
