---
title: "Test harness credential defaults and interpolated key set diverge from config.example.yml"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #4961 and documented in-code as a deliberate deviation; filing
so it is tracked rather than living only in a doc comment.

Rails' `test/config.example.yml` interpolates **only** `MYSQL_HOST`,
`MYSQL_PORT` and `MYSQL_SOCK` from the environment and hard-codes everything
else — notably `username: rails` on both `mysql2.arunit` and `mysql2.arunit2`
(`config.example.yml:4,12-19,24`). The `postgresql:` entries carry no
connection fields at all and defer entirely to libpq's `PG*` env
(`config.example.yml:74-81`).

`packages/activerecord/src/test-helpers/test-connection-env.ts` diverges twice:

- **Interpolated key set** — trails additionally reads `MYSQL_USER`,
  `MYSQL_PASSWORD`, `MYSQL_DATABASE` (and the `PG*` equivalents), which Rails
  does not interpolate.
- **Defaults** — `root` / `postgres` / `rails_js_test`, chosen to match the
  containers `.github/workflows/ci.yml` provisions. Rails' `rails` user would
  not authenticate against them.

The `ARCONN`-selects / sub-settings-describe _split_ is genuine Rails parity;
only the key set and defaults diverge. Recorded in the module's "Deviations
from config.example.yml" section and in README.

## Acceptance criteria

Decide and record one of:

- provision a `rails` user (and matching database) in the CI containers so the
  harness can adopt Rails' hard-coded credential and shrink the interpolated
  set to Rails' three keys; or
- accept this permanently, with the deviation note kept as the record.

Either way the outcome is written down rather than re-derived. If accepting,
confirm nothing in the suite depends on the credential being configurable.
