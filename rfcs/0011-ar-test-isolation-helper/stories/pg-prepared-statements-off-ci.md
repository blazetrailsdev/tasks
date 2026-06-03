---
title: "Add prepared_statements: false CI dimension (PG + MySQL toggle)"
status: ready
rfc: "0011-ar-test-isolation-helper"
cluster: test-config-fidelity
deps: []
deps-rfc: []
est-loc: 80
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails maintains a dedicated `arunit_without_prepared_statements` PG connection
and a `MYSQL_PREPARED_STATEMENTS` env toggle, so material parts of its suite run
with prepared statements **off**. We have the feature
(`statement-cache.ts`, `prepared-statements-disabled.test.ts`) but our CI only
ever runs PS-on, leaving the unprepared bind/cast path effectively untested.

See RFC 0011 §Motivation "Config fidelity" and
[Rails `config.example.yml`](https://github.com/rails/rails/blob/main/activerecord/test/config.example.yml).

## Acceptance criteria

- [ ] CI runs a PG dimension with `prepared_statements: false` (a second vitest
      step in `postgres-tests`, or an env-toggled run) covering the core AR suite
- [ ] MySQL honors a `MYSQL_PREPARED_STATEMENTS` toggle in CI for the same effect
- [ ] The PS-off run is green (fix any unprepared-path failures it surfaces, or
      file them as follow-ups if out of scope)
- [ ] Negligible added wall-clock, or the dimension is scoped to a subset with a
      note on what's covered

## Notes

This is the highest-value config-fidelity gap — most untested production code
sits behind the unprepared path. Lives in `.github/workflows/ci.yml`
(`postgres-tests` / `mariadb-tests` jobs).
