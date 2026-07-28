---
title: "mysql-prepared-statements-env-toggle"
status: done
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5521
claim: "2026-07-28T16:05:11Z"
assignee: "mysql-prepared-statements-env-toggle"
blocked-by: null
closed-reason: null
---

## Context

`config.example.yml:7-11` makes the mysql2 `prepared_statements` value an env
toggle — `prepared_statements: true` when `ENV['MYSQL_PREPARED_STATEMENTS']` is
present, `false` otherwise — and repeats the same block for `arunit2`
(`config.example.yml:26-30`).

`support/connection.ts` hardcodes `preparedStatements: false` on both entries
(the `arunit` and `arunit2` builders in `CONNECTIONS.mysql2`), so the env var is
inert: there is no way to run the mysql lane with prepared statements on, and
the `arunit_without_prepared_statements` entry — whose whole purpose is to be
the one entry with them off (`config.rb:27-28`, `expandConfig`) — is
indistinguishable from `arunit`.

Surfaced during review of #5516, which made that entry the source for
`newRawTestAdapter()` as well as the pool, so the hardcoded value now reaches
every mysql-lane adapter.

Note `config.ts` deliberately interpolates exactly the key set
`config.example.yml` interpolates, pinned by `config.test.ts` ("interpolates
exactly the sub-setting key set config.example.yml interpolates") — that test
will need `MYSQL_PREPARED_STATEMENTS` added to its expected set as part of this
change, since Rails does interpolate it.

## Acceptance criteria

- The mysql2 `arunit` and `arunit2` entries resolve `preparedStatements` from
  `MYSQL_PREPARED_STATEMENTS` (present → `true`, absent → `false`), matching
  `config.example.yml:7-11,26-30`.
- `arunit_without_prepared_statements` keeps `preparedStatements: false`
  regardless of the env var, as Rails' dedicated entry does.
- `config.test.ts`'s interpolated-key-set assertion covers the new var.
- Presence, not truthiness: Rails tests `ENV['MYSQL_PREPARED_STATEMENTS']` with
  a bare `if`, so `=0` still means on. Do not route it through `present()`'s
  empty-string rejection without deciding that deliberately.
