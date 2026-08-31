---
title: "Flip the assertion-mismatch gate from ratchet to hard zero"
status: ready
updated: 2026-08-13
rfc: "0132-ar-closure-assertion-parity"
cluster: enforcement
packages:
  - "activerecord"
  - "activesupport"
deps:
  - "widen-assertion-report-packages-and-seed-mark"
  - "size-and-file-assertion-work-for-widened-packages"
  - "assertions-associations-and-eager"
  - "assertions-attribute-methods-test"
  - "assertions-autosave-association"
  - "assertions-base-test"
  - "assertions-belongs-to-has-one-inverse"
  - "assertions-calculations-test"
  - "assertions-database-tasks-and-schema-dumper"
  - "assertions-enum-dirty-strict-loading"
  - "assertions-finder-test"
  - "assertions-habtm-and-nested-through"
  - "assertions-has-many-associations"
  - "assertions-has-many-through-cluster"
  - "assertions-migration-cluster"
  - "assertions-persistence-and-nested-attributes"
  - "assertions-postgresql-geometric-array-and-adapter"
  - "assertions-postgresql-range-and-schema"
  - "assertions-reflection-primary-keys-multiparameter"
  - "assertions-relations-test"
  - "assertions-scoping-relation-batches-insert-all"
  - "assertions-sqlite3-adapter"
  - "assertions-tail-adapters-1"
  - "assertions-tail-adapters-2"
  - "assertions-tail-adapters-3a"
  - "assertions-tail-adapters-3b"
  - "assertions-tail-adapters-3c"
  - "assertions-tail-associations-1"
  - "assertions-tail-root-1"
  - "assertions-tail-root-2"
  - "assertions-tail-root-3"
  - "assertions-tail-root-4"
  - "assertions-tail-root-5a"
  - "assertions-tail-root-5b"
  - "assertions-tail-root-5c"
  - "assertions-tail-root-6a"
  - "assertions-tail-root-6b"
  - "assertions-transactions-locking-and-pool"
  - "assertions-validations-and-encryption"
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Assertion mismatches are report-only today: `scripts/test-compare/compare.ts:606-663`
records them, nothing fails on them, and RFC 0025's ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`, PR #5790,
`pnpm parity:test:assertions`) only guarantees the debt never grows. A number
that only counts when someone reads the report is the same problem as an
exclusion nobody revisits — which is why the RFC's "Done means" requires the
flip, not just the burn.

The precedent is in the same file: gate-mismatch went advisory → ratchet → hard
zero, and now `enforceGateZero` (`compare.ts:150-181`, `GATE_ENFORCED_PACKAGES`
at `:82`) exits non-zero with no baseline at all. This story does the same for
the three assertion axes, once every in-scope package reads 0/0/0 — it is the
last story in the RFC and is gated on all the `assertions-*` stories plus the
widened packages' burndown.

Its `deps` list is **maintained, not fixed**: the widened-package burndown
stories do not exist yet — `size-and-file-assertion-work-for-widened-packages`
files them once the measurement is in — so that story carries an acceptance
criterion to append each one it files to this story's `deps` (`pnpm tasks
set-deps`) before it closes. Do not close the sizing story with this list
unchanged, and do not claim this one on the strength of the current list alone.

## Acceptance criteria

- `pnpm parity:test -- --check` fails when any package in the in-scope closure
  reports a non-zero assertion-count, assertion-kind or assertion-value
  mismatch, with no baseline or mark to absorb it.
- `scripts/test-compare/assertion-mismatch-mark.json` is deleted (or reduced to
  the packages still outside the enforced set), and
  `pnpm parity:test:assertions` / `:reseed` are retired or re-pointed — no
  vestigial ratchet left next to a hard gate.
- The enforced package set is explicit and named in code the way
  `GATE_ENFORCED_PACKAGES` is, with the out-of-scope packages (actionview,
  trailties, actioncontroller, actiondispatch) still report-only.
- Before claiming: this story's `deps` include every widened-package assertion
  story that `size-and-file-assertion-work-for-widened-packages` filed, and all
  of them are `done`. A short `deps` list here means the sizing story's own
  acceptance criterion was skipped, not that the work is finished.
- CI is green on the flip, which is only true if every burndown story has
  landed — do not claim this story before then.
