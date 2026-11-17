---
title: "maintain_test_schema still races parallel vitest workers on a fresh test database"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activerecord"]
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

`generated-app-first-test-run-races-maintain-test-schema-across-workers` (done) fixed this for generated apps, but trailmap still hit it at trails 1d8d3725a3. The CI `gate` job runs three vitest files with no `storage/test.sqlite3`. Each worker's boot runs `packages/trailties/lib/testing/maintain-test-schema.ts`, and they create one fresh file at once: `SQLite3::BusyException: database is locked` past the 5s busy timeout, in `configureConnection` → `setJournalMode`. trailmap#151 works around it with `NODE_ENV=test bin/trails db:migrate:primary` before the tests.

Rails: `parallelize` gives each worker its own database (`ActiveRecord::TestDatabases.create_and_load_schema(i, env_name:)`, `activerecord/lib/active_record/test_databases.rb`). `maintain_test_schema` runs once per process, never on a file another worker is also creating.

## Expected shape

Under vitest workers, the test schema is set up once, or per worker on a per-worker file, so a fresh checkout's first parallel run doesn't race.

## Acceptance criteria

- With no test database file, three vitest files that boot the app all pass on the first run.

- trailmap's gate job can drop its `db:migrate:primary` step.
