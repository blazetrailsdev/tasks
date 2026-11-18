---
title: "test-help builds each worker's test databases once per worker, not once per file"
status: draft
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `parallelize_setup` (`test_databases.rb` `after_fork_hook` → `create_and_load_schema`)
runs once per worker process. Under vitest the setup file, `test/test-helper.ts`, is
re-evaluated for every FILE a worker runs, so `TestDatabases.createAndLoadSchema` runs
per file and truncates the worker's database each time. trailmap#159 works around it with
a `TRAILMAP_TEST_DATABASE_<n>_PREPARED` env latch and `SKIP_TEST_DATABASE_TRUNCATE` around
the call (test/test-helper.ts). Every `trails new` app with vitest has the same problem.

## Acceptance criteria

- trails' test-help (or `TestDatabases`) builds each worker's databases once per worker,
  and later files in the worker only point the configurations at `<database>-<n>`.
- A trails test runs two files in one worker and asserts the second sees no truncate.
- trailmap's latch is deleted when this is vendored.
