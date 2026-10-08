---
title: "Run the SQLite :memory: lane on PRs that touch an inMemoryDb() arm"
status: draft
updated: 2026-10-08
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `Active Record SQLite :memory: Tests` job (`sqlite-mem-tests` in `.github/workflows/ci.yml`) runs on `main`, the Monday sweep and `workflow_dispatch`, and on a pull request only when it carries the `run-sqlite-mem` label. `ARCONN=sqlite3_mem` is the only lane where `inMemoryDb()` (`packages/activerecord/src/support/adapter-helper.ts`) is true.

So a PR that adds or changes an `inMemoryDb()` arm merges with that arm never run. trails#8692 enrolled `asynchronous_queries_test.rb`, whose `async select all` has an `in_memory_db?` arm (`vendor/rails/v8.0.2/activerecord/test/cases/asynchronous_queries_test.rb:106-107`). The arm failed on its first run, on `main`, reddened two consecutive commits and paused the spawn loop until trails#8693 (story `red-380abead`) fixed it.

## Acceptance criteria

- A pull request whose diff adds or changes a line referencing `inMemoryDb` under `packages/activerecord/src/` runs `sqlite-mem-tests` without anyone adding the label. The `changes` job is the place for the detection; note its `run:` script is close to the Actions size limit.
- A pull request that touches no such line still skips the lane, as today.
- The `run-sqlite-mem` label keeps working as the manual override.
