---
title: "label-gate-ar-db-matrix"
status: closed
updated: 2026-07-25
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Evaluated all three gating options; user declined all of them. Adapter coverage on PRs stays as-is."
---

# Evaluate label-gating part of the AR DB matrix on plain PRs

## Context

Every AR-affecting PR (`activerecord_affected=true`, gate at
`.github/workflows/ci.yml:107` / job `if:`s) currently runs 5 DB-suite runners:

- `sqlite-tests` (ci.yml:772) — 1 runner
- `postgres-tests` (ci.yml:969) — 2-way shard matrix, 2 runners
- `maria-tests` (ci.yml:1129) — 2-way shard matrix, 2 runners
- (`mysql-tests` ci.yml:1054 is already parked with `false &&`; maria stands in)

Each runs `pnpm build` + the full AR vitest suite (+ activerecord-cli E2E on
shard 1). That is the dominant per-PR CI cost for AR work, which is most PRs.

The parity suites already model the alternative: expensive suites are
label-gated (`run-parity-sqlite` etc., ci.yml:352-372) and forced on for
push-to-main / weekly schedule (`force_all_affected`, ci.yml:275-279), so
post-merge coverage is unconditional.

## Tradeoff to write out (do NOT just gut adapter coverage)

This repo's core value is adapter fidelity; PG/MariaDB-specific breakage on an
AR PR is common (type casting, DDL, RETURNING, quoting). Options, roughly in
increasing savings / increasing risk:

1. Keep all three adapters but drop postgres/maria to 1 shard on PRs, 2 on
   main (saves 2 runners, keeps full adapter signal, longer wall time).
2. Label-gate maria (`run-mysql`) on PRs, keep sqlite+postgres always; maria
   still runs on push-to-main + schedule. Risk: mysql2-adapter breakage lands
   on main and is caught post-merge, needing a follow-up PR.
3. Heuristic gate: run PG/maria only when the diff touches adapter/quoting/
   schema paths (`packages/activerecord/src/**/{connection-adapters,arel}**`),
   label to force. Risk: cross-cutting AR changes (e.g. types/) break adapters
   without touching those paths — needs a path audit of past adapter-only
   failures before trusting it.

Whatever is chosen, the aggregate `ci` job's skip allowlist
(ci.yml:1622-1633, `sqlite-tests|postgres-tests|maria-tests` case keyed on
`AR_AFFECTED`) must learn the new skip condition, or a legitimately-skipped
job will fail the run as "unexpectedly skipped".

## Acceptance criteria

- A written decision (in the story/PR) on which option to take, with the
  fidelity risk explicitly weighed, reviewed by the user before implementing.
- Chosen gating implemented in `.github/workflows/ci.yml` with the `changes`
  job outputs + `ci` aggregate allowlist updated consistently.
- Push-to-main and weekly schedule still run ALL adapters unconditionally.
- A skipped DB job on a PR reports success through the aggregate `ci` gate
  (no skipped-but-required wedge).
