---
title: "Converge test-backend resolution onto Rails config.yml + ARCONN (drop *_TEST_URL sniffing)"
status: claimed
updated: 2026-07-08
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-07-08T23:22:34Z"
assignee: "converge-test-backend-resolution-onto-rails-config-yml"
blocked-by: null
closed-reason: null
---

## Context

Trails' test-backend resolution is a divergence from Rails. Rails selects the
backend by a **named connection** looked up in a `config.yml`
`connections:` hash, keyed purely off `ARCONN` (falling back to
`config["default_connection"]`) — it never uses a URL env var:

- `vendor/rails/activerecord/test/support/connection.rb:10` —
  `connection_name = ENV["ARCONN"] || config["default_connection"]`.
- `vendor/rails/activerecord/test/support/connection.rb:14-19` —
  `config.fetch("connections").fetch(connection_name) { puts "Connection ... not found"; exit 1 }`
  (hard exit when `ARCONN` names an unconfigured connection).
- `vendor/rails/activerecord/test/support/connection.rb:35-37` —
  after establishing, `unless connection_name.include?(arunit_adapter) raise ArgumentError`
  (loud failure when `ARCONN` and the resolved adapter diverge).
- `vendor/rails/activerecord/test/config.example.yml` — the canonical shape:
  `connections: { mysql2: {...}, postgresql: {...}, sqlite3: {...}, sqlite3_mem: {...} }`,
  each with `arunit` / `arunit2` entries. `ENV` only feeds _sub-settings_
  (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_SOCK`, prepared-statements), never a URL.

Trails instead sniffs `PG_TEST_URL` / `MYSQL_TEST_URL` env vars in
`packages/activerecord/src/test-helpers/test-database-config.ts:resolve()`
(RFC 0002 invention). PR #4768 added a loud guard as a stopgap — the trails
analogue of Rails' `connection_name.include?(arunit_adapter)` raise — but the
underlying `*_TEST_URL` mechanism itself is non-Rails.

This story converges the whole resolution mechanism onto Rails' model: a
`config.yml`-style named-connections map (mirroring `config.example.yml`),
selected purely by `ARCONN` / a `default_connection`, with `ENV` feeding only
sub-settings — replacing the `*_TEST_URL` sniff.

## Acceptance criteria

- `test-database-config.ts` resolves the backend from a named-connections
  map keyed by adapter (`mysql2` / `postgresql` / `sqlite3` / `sqlite3_mem`),
  selected by `ARCONN` (falling back to a `default_connection`), mirroring
  `vendor/rails/activerecord/test/config.example.yml`.
- An unconfigured `ARCONN` connection name fails loudly (Rails' "Connection
  not found" + exit), and an `ARCONN`/resolved-adapter mismatch raises
  (Rails' `ArgumentError`). PR #4768's guard folds into this.
- The `PG_TEST_URL` / `MYSQL_TEST_URL` URL-sniffing path is removed; any
  host/port/socket/credential inputs come through Rails-mirrored sub-setting
  env vars, not a URL string.
- CI (`.github/workflows/ci.yml`) is migrated off `PG_TEST_URL` /
  `MYSQL_TEST_URL` onto the new inputs; sqlite / postgres / mysql / maria
  jobs stay green.
- Covered by tests in `test-database-config.test.ts` (named-connection
  resolution, `default_connection` fallback, unconfigured-name failure,
  adapter-mismatch raise).

## Notes

- Hard rules carry over: NO `node:*` imports, NO `process.*` (use
  `getEnv`), async fs only, no new runtime deps.
- Larger than the 500-LOC ceiling is likely — split across non-overlapping
  PRs from `main` if so, but keep the `config.yml` shape and the `ARCONN`
  selector in the first PR so later PRs build on a Rails-faithful base.
