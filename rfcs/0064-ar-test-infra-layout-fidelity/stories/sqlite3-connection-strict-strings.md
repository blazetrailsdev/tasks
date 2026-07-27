---
title: "sqlite3-connection-strict-strings"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
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

## Context

`vendor/rails/activerecord/test/config.example.yml:83-87` gives the `sqlite3`
`arunit` connection three keys:

```yaml
sqlite3:
  arunit:
    database: <%= FIXTURES_ROOT %>/fixture_database.sqlite3
    timeout: 5000
    strict: true
```

trails' counterpart entry (`packages/activerecord/src/support/test-database-config.ts`,
`CONNECTIONS.sqlite3` -> `sqliteHash()`) emits only `{ adapter, database }` —
`timeout` and `strict` are both missing. `strict: true` is the one that has
teeth: it turns on SQLite strict-strings (DQS off) via
`SQLite3Adapter`'s `strict` option (`connection-adapters/sqlite3-adapter.ts:290,386`),
so the whole default sqlite lane currently runs with double-quoted-string
literals still legal, unlike Rails.

Surfaced while reviewing #5398 (`support/adapter-helper.ts`): Rails'
`sqlite3_adapter_strict_strings_disabled?` (`adapter_helper.rb:15-16`) reads
`configuration_hash[:strict]`, and against the trails config it answers "strict
is disabled" on a lane where Rails answers "enabled". The predicate itself is
now faithful — it reads the configured hash — so closing this gap is purely a
config-fidelity change in `test-database-config.ts`.

Deliberately NOT done in #5398: RFC 0064 is a layout-fidelity RFC and states
"Not a behavior change to the harness". Turning strict strings on may fail
tests that rely on DQS, which needs its own PR and its own full-suite CI run.

## Acceptance criteria

- `CONNECTIONS.sqlite3` builds `{ adapter, database, timeout: 5000, strict: true }`,
  matching `config.example.yml:83-87`.
- Full suite green on the sqlite lane, or each failure fixed at the query site
  (double-quoted string literal -> single-quoted) rather than by dropping `strict`.
- `sqlite3AdapterStrictStringsDisabled()` (`support/adapter-helper.ts`) then
  reports false on the default lane without any change to that file.
- Check whether `sqlite3_mem` needs the same keys (config.example.yml:92-95 does
  not set them there).
