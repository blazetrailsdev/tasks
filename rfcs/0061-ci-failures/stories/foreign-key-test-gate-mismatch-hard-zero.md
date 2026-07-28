---
title: "foreign-key-test-gate-mismatch-hard-zero"
status: closed
updated: 2026-07-28
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 5476
claim: null
assignee: null
blocked-by: null
closed-reason: "fixed on main by PR 5466 (test(migration): converge the two foreign-key gate mismatches)"
---

## Context

`pnpm exec tsx scripts/test-compare/test-compare.ts --gates --check` fails on
`main` — the `Rails API/Test Comparison` CI job's last step:

    ✗ gate-mismatch check failed (hard zero, no baseline):
      activerecord: 2 gate-mismatch (must be 0)

Both are in `packages/activerecord/src/migration/foreign-key.test.ts`, which
last changed in #5450 (ported the `remove_foreign_key` cases) and #5451
(stopped skipping the migration test directory in test-compare). Turning the
directory on is what made these two visible to the gate check.

    [wrong-gate] "remove foreign key by name"
        rails: adapters=[mysql,postgresql] features=[foreign_keys]
        ts:    features=[foreign_keys] guards=[unknown]
    [wrong-gate] "remove foreign key with restrict action"
        rails: features=[foreign_keys]
        ts:    adapters=[postgresql,sqlite] features=[foreign_keys]

- `remove foreign key by name` (foreign-key.test.ts:260) is written
  `it.skipIf(!unlessSqlite3Adapter)(...)` — the extractor cannot resolve that
  local into an adapter set, so it reports `guards=[unknown]` instead of
  Rails' `adapters=[mysql,postgresql]`.
- `remove foreign key with restrict action` (foreign-key.test.ts:311) is
  `it.skipIf(adapterType === "mysql")(...)`, a deliberate trails-only gate: the
  comment above it (lines 305-310) argues MySQL's
  `extract_foreign_key_action` override
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:224-226`)
  reflects `on_delete` as nil, so `defined_for?` never matches and the removal
  raises. Rails leaves the case ungated. So this one is a real deviation that
  needs either a registered-gate form the comparator accepts or a converged
  implementation.

Surfaced by PR 5467's CI run
(<https://github.com/blazetrailsdev/trails/actions/runs/30317237053/job/90145420854>),
whose diff touches no test file and is unrelated.

## Acceptance criteria

- `pnpm exec tsx scripts/test-compare/test-compare.ts --gates --check` exits 0
  (activerecord gate-mismatch back to the hard zero).
- The `unlessSqlite3Adapter` gate is spelled so the extractor resolves it to
  Rails' `adapters=[mysql,postgresql]` rather than `guards=[unknown]`.
- The MySQL `restrict` gate is either converged away or recorded the way the
  gate machinery expects a deliberate deviation to be recorded — not silenced.
- Test names are unchanged.
