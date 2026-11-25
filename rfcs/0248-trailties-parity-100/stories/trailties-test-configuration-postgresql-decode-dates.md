---
title: "trailties-test-configuration-postgresql-decode-dates"
status: done
updated: 2026-11-25
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10709
claim: "2026-11-24T17:56:59Z"
assignee: "trailties-test-configuration-config-for-yaml"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb:2932-2964`
has three `PostgresqlAdapter.decode_dates …` tests. Each writes
`config/initializers/active_record.rb` with
`ActiveRecord::Base.establish_connection(adapter: "postgresql")` and boots the
app in development. In Rails `establish_connection` is lazy, so no server is
contacted and the test only reads `PostgreSQLAdapter.decode_dates`.

Ported in-process in `packages/trailties/test/application/configuration.test.ts`
(the harness used by parts 4/5, trails PR for
`trailties-test-application-configuration-part-4`), the same initializer makes
trails attempt a real PostgreSQL connection during boot: a
`DatabaseConnectionError.hostnameError` surfaces as an unhandled rejection
(`packages/activerecord/lib/connection-adapters/abstract-adapter.ts:1414`,
reached from the pool), which also reds later tests in the file. The likely
source is the trails-only schema-cache warm in
`packages/trailties/lib/trailties/active-record.ts` (`config.toPrepare` →
`warmSchemaCache` → `pool.schemaReflection.loadAllBang`), which Rails has no
counterpart for and which connects eagerly outside `test`.

The railtie side is already converged in that PR:
`active_record.postgresql_adapter_decode_dates` now wraps its `on_load` in
`config.after_initialize` as `activerecord/lib/active_record/railtie.rb:197-205`
does.

## Acceptance criteria

- [ ] Booting a development app whose initializer calls
      `Base.establishConnection({ adapter: "postgresql" })` with no server
      reachable does not attempt a connection (no unhandled rejection).
- [ ] The three tests at `configuration_test.rb:2932-2964` are ported into
      `packages/trailties/test/application/configuration.test.ts` under their
      Rails names and pass.
