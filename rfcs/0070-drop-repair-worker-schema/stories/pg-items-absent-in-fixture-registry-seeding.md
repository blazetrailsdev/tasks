---
title: "PG flake: canonical items table absent in fixtureRegistry seeding test"
status: in-progress
updated: 2026-07-28
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5519
claim: "2026-07-28T15:44:22Z"
assignee: "pg-items-absent-in-fixture-registry-seeding"
blocked-by: null
closed-reason: null
---

## Context

`use-fixtures.test.ts > fixtureRegistry seeds against TEST_SCHEMA > every
registered entry seeds without error` failed the **Active Record PostgreSQL
Tests (2)** shard on PR #5349 with:

```text
unseedable registry entries:
items: relation "items" does not exist
```

Re-running the same job on the same SHA passed, so it is scheduling-dependent,
not deterministic. Evidence gathered while triaging #5349:

- Only PG shard 2 failed; SQLite, MariaDB (1)/(2) and PostgreSQL (1) all passed
  on the same commit.
- Not reproducible on an isolated PostgreSQL stack (private port, so a sibling
  worktree's containers cannot confound it): the file alone passed 54/54
  including this assertion, and the `items` consumers run together under
  `AR_DB_FORKS=4` to force contention (`use-fixtures`, `readonly`, `reflection`,
  `persistence`, `calculations`, `batches`, `associations`, `named-scoping`)
  passed 848/848.
- The older `items` collision mechanism recorded in
  `items-table-convergence` (done) no longer applies: no test file defines a
  divergent `items` via `defineSchema` any more (`grep` finds zero). `items` is
  in the canonical `TEST_SCHEMA` (`test-schema.ts:859`) and in Rails'
  `schema.rb:685`. The symptom here is the table being **absent entirely** on
  that worker's database, not having the wrong columns.

The underlying fragility is that this test seeds **every** `fixtureRegistry`
entry against the worker DB, so it is the single most sensitive consumer of
shared-DB state in the suite — any table another file drops or fails to create
surfaces here first, and it does so as a suite-level error rather than a
meaningful assertion. It also runs ~87s on PG under a 300s timeout.

## Acceptance criteria

- Establish why `items` can be absent from a PG worker database mid-run: whether
  a sibling suite drops it, whether the per-worker canonical schema build can
  skip or lose it, or whether the DB slot is being recycled underneath the file.
- Either make the registry-seeding test resilient (assert against a schema it
  guarantees itself) or fix the producer so the canonical table set cannot go
  missing for a worker.
- The fix must be verified on the PG lane specifically; this class is invisible
  on SQLite.

Do not fix this inside an unrelated feature PR — that is why it is filed here.
