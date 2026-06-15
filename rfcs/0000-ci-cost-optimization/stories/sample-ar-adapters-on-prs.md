---
title: "Sample AR adapters on PRs (SQLite-only) with full trio on main + nightly [COVERAGE CUT]"
status: draft
updated: 2026-06-15
rfc: "0000-ci-cost-optimization"
cluster: coverage-reduction
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

**HIGHER-RISK COVERAGE REDUCTION — needs explicit user approval before
implementation.** This repo's #1 principle is Rails fidelity; this story
deliberately trades some of it for cost, so it must not ship without sign-off.

The three AR adapter jobs are ~24 billed min — **half of every full run**:
PostgreSQL 9.86, MariaDB 8.43, SQLite 5.86. Today all three run on every
AR-affecting PR. This story proposes running **only SQLite on PRs** and the
**full PG + MariaDB + SQLite trio on `main` pushes and the nightly schedule**
(which already runs everything via `force_all_affected`).

The mechanism mirrors the existing per-adapter parity gating: PG/MariaDB on PRs
gate behind a new condition that is true on push/schedule/dispatch, or on a PR
carrying an opt-in label (reuse/extend the `run-parity-postgres` /
`run-parity-mysql` label precedent so a PR touching adapter-specific code can
opt back into the full trio).

### The fidelity tradeoff (spell it out)

- **What we lose:** PG- and MariaDB-specific bugs (type mapping, DDL quirks,
  adapter-specific SQL) would not be caught until the change lands on `main` (or
  the nightly sweep), not at PR time. Adapter test lanes are currently CI-gated
  on PRs precisely to catch these early.
- **What protects us:** SQLite still runs on every PR; `main` + nightly run the
  full trio, so nothing merges to a release without full-adapter coverage having
  run at least once; the opt-in label lets adapter-heavy PRs restore full
  coverage on demand.
- **Why it might still be wrong:** a PG/MariaDB regression caught only on `main`
  reds the post-merge build and forces a follow-up fix PR — for adapter-heavy
  work that round-trip can cost more than the minutes saved.

## Acceptance criteria

- [ ] `postgres-tests` and `maria-tests` gain an `if:` condition that is true
      on push/schedule/workflow_dispatch (full trio) and on PRs **only** when an
      opt-in label is present; false on plain PRs. `sqlite-tests` is unchanged
      (always runs when `activerecord_affected`).
- [ ] Extend the `changes` job to emit the needed gate output(s) and document
      the label name(s) in the workflow header comment alongside the existing
      `run-parity-*` docs.
- [ ] Update the aggregate `ci` job's skip-allowlist so a plain-PR skip of
      `postgres-tests`/`maria-tests` is legitimate, while a skip when they
      _should_ have run still fails.
- [ ] CI green on: a plain AR PR (only SQLite runs), an AR PR with the opt-in
      label (full trio), and a push to `main` (full trio).

## Savings & risk

- **Est. savings:** ~**18 billed job-min per plain AR PR** (PG 9.86 + MariaDB
  8.43). PRs are ~73% of runs and AR-affecting PRs are the common case, so this
  is by far the **largest single lever** in the RFC — on the order of thousands
  of shadow-minutes/month.
- **Risk:** **HIGH (coverage reduction / fidelity).** Requires explicit user
  approval. The whole point of CI-gated adapter lanes (RFC 0012) was early
  cross-adapter detection; this narrows that on PRs.

## Notes

If the user prefers a softer cut, viable variants to offer: (a) run SQLite + one
of PG/MariaDB on PRs (alternating or PG-only), or (b) keep all three on PRs but
move only MariaDB to nightly. Present the break-even and let the user choose the
floor. Do **not** implement any variant without sign-off.
