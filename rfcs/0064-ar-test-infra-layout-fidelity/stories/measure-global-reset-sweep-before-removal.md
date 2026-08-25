---
title: "measure-global-reset-sweep-before-removal"
status: done
updated: 2026-08-01
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5707
claim: "2026-07-31T02:00:04Z"
assignee: "measure-global-reset-sweep-before-removal"
blocked-by: null
closed-reason: null
---

## Context

`remove-global-reset-and-skip-shield-after-canonical-burndown` removes the
global `beforeEach` reset (`packages/activerecord/src/cases/helper.ts:75-77` →
`resetTestTables`, `packages/activerecord/src/test-adapter.ts:257`) and
`support/skip-global-reset.ts`. The audit in
`drop-bespoke-tables-per-file-like-rails` established that the per-file
cleanup discipline is in place — `blazetrails/require-table-teardown` proves
every created table is dropped in its own file, and every drop now runs on
failure too — so the sweep should already have nothing to do. That is an
argument, not a measurement.

Before deleting the sweep, measure it: make `resetTestTables` report the
tables it actually drops, run the AR suite on every adapter lane, and confirm
the swept set is empty. A non-empty set names exactly the files still leaking
and becomes the remaining backlog.

## Acceptance criteria

- Instrument `resetTestTables` (`packages/activerecord/src/test-adapter.ts:257`)
  so a full-suite run reports every table it drops, per adapter lane, without
  changing behavior when the instrumentation is off.
- Record the swept set for sqlite3 / postgresql / mysql2 lanes.
- If the set is empty, say so on
  `remove-global-reset-and-skip-shield-after-canonical-burndown` as the
  evidence that unblocks it; if not, file the leaking files as follow-ups.
- Remove the instrumentation, or keep it only behind an off-by-default flag.
