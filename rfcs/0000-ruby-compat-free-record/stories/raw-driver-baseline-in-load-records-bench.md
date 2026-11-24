---
title: "The load-records bench reports the bare driver beside ActiveRecord"
status: draft
updated: 2026-11-24
rfc: "0000-ruby-compat-free-record"
cluster: spike
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/bench/activerecord-load-records.mts` (trails) creates a 12,000-row,
24-column `stories` table on in-memory SQLite and reports
`Story.all().toArray()` in microseconds per record, and a 24-column `pluck`.
It reports nothing for the same rows read through the driver alone, so the
cost of the model layer is not known. The RFC's headline number is that
ratio (README, "Verification", "Raw SQL ratio"), and the spike needs the
baseline before it has anything to compare with.

## Acceptance criteria

- [ ] The bench also times `better-sqlite3` directly, on a second handle to
      a database holding the same rows: one prepared `SELECT * FROM stories`
      returning 12,000 row objects, and one prepared
      `SELECT * FROM stories WHERE id = ?` run 12,000 times.
- [ ] It times the ActiveRecord equivalent of the second, `Story.find(id)`
      12,000 times.
- [ ] Each run prints both pairs and their ratios: ActiveRecord load over
      driver load, ActiveRecord `find` over driver `get`.
- [ ] Run with `--expose-gc`, it also prints heap bytes retained per loaded
      record for each side: `heapUsed` after a forced collection with the
      12,000 results held, less `heapUsed` before the load.
- [ ] The two ratios, with the Node version and machine, are written into
      the RFC README's "Motivation" under "Raw SQL gap", replacing the
      sentence that says the cost is not known.

## Definition of done

A figure taken under vitest does not close this story: the bench runs under
plain `node` or `tsx`.

## Verification

    node --expose-gc --import tsx scripts/bench/activerecord-load-records.mts

## Notes

The change is in `scripts/bench/` only; no package is touched. `better-sqlite3`
is a root devDependency of trails (`package.json`), so a script under
`scripts/` resolves it with no new dependency.
