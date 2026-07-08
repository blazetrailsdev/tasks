---
title: "remove-test-url-sniffing-migrate-ci-onto-sub-settings"
status: ready
updated: 2026-07-08
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Remove \*\_TEST_URL sniffing harness-wide and migrate CI onto Rails sub-settings

## Context

The foundation PR (converge-test-backend-resolution-onto-rails-config-yml)
converged **backend selection** onto Rails' model: `test-database-config.ts`
now resolves the backend from a `config.yml`-style named-connections map keyed
by `ARCONN` (falling back to a `default_connection`), with a Rails-faithful
"connection not found" failure and adapter-mismatch raise (folding in the PR 4768 guard). See
`vendor/rails/activerecord/test/support/connection.rb:10,14-19,35-37` and
`vendor/rails/activerecord/test/config.example.yml`.

But `PG_TEST_URL` / `MYSQL_TEST_URL` remain as the _connection-detail_ source
in that map, and the rest of the test harness still SELECTS the backend by URL
presence, not `ARCONN`:

- `packages/activerecord/src/test-adapter.ts:33-39,86-126` — `adapterType`,
  `_primaryConfiguration`, and `newRawTestAdapter` all branch on
  `PG_TEST_URL` / `MYSQL_TEST_URL`.
- `packages/activerecord/src/test-setup-worker-db.ts:143-174` — worker-DB
  isolation suffixes the URL strings.
- `packages/activerecord/src/test-helpers/template-global-setup.ts:133,226` —
  template DB build keys off the URLs.
- `packages/activerecord/src/test-helpers/arunit2-config.ts:87-91` — derives
  the second DB from the URLs.
- `packages/activerecord/src/test-helpers/sqlite-template.ts:68`,
  `vitest.config.ts:330,355`, `ddl-profile.ts:295-296`.
- CI (`.github/workflows/ci.yml:990,997,1051,1116`) sets `PG_TEST_URL` /
  `MYSQL_TEST_URL`.

Because every consumer shares the URL env var, this cannot be split into
non-overlapping-file PRs while keeping CI green — it is one coordinated change.

## Acceptance criteria

- All `*_TEST_URL` reads across `test-adapter.ts`, `test-setup-worker-db.ts`,
  `template-global-setup.ts`, `arunit2-config.ts`, `sqlite-template.ts`,
  `vitest.config.ts`, and `ddl-profile.ts` are removed. Backend selection is
  driven by `ARCONN` (via the resolved config from `test-database-config.ts`);
  connection details come from Rails-mirrored sub-setting env vars
  (`PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`, `MYSQL_HOST`/`MYSQL_PORT`/
  `MYSQL_SOCK`/credentials), never a URL string.
- `test-database-config.ts`'s `postgresql`/`mysql2` connection builders build
  their `HashConfig` from those sub-settings rather than reading `PG_TEST_URL` /
  `MYSQL_TEST_URL`.
- CI (`.github/workflows/ci.yml`) is migrated off `PG_TEST_URL` /
  `MYSQL_TEST_URL` onto the sub-setting inputs; sqlite / postgres / maria jobs
  stay green.
- `README.md:255-256` and `package.json:21` (`test:db`) updated off the URLs.

## Notes

- Hard rules carry over: NO `node:*` imports, NO `process.*` (use `getEnv`),
  async fs only, no new runtime deps.
