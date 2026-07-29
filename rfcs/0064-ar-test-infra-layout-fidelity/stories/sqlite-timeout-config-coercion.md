---
title: "sqlite-timeout-config-coercion"
status: claimed
updated: 2026-07-29
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-29T18:10:14Z"
assignee: "sqlite-timeout-config-coercion"
blocked-by: null
closed-reason: null
---

## Context

Rails applies the sqlite `timeout` option inside `configure_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:820-830`):

```ruby
if @config[:timeout] && @config[:retries]
  raise ArgumentError, "Cannot specify both timeout and retries arguments"
elsif @config[:timeout]
  timeout = self.class.type_cast_config_to_integer(@config[:timeout])
  raise TypeError, "timeout must be integer, not #{timeout}" unless timeout.is_a?(Integer)
  @raw_connection.busy_handler_timeout = timeout
elsif @config[:retries]
  ActiveRecord.deprecator.warn(...)
end
```

trails has none of that block. `openConfig()`
(`connection-adapters/sqlite3-adapter.ts:2943-2952`) copies `cfg.timeout`
straight into the driver open config, and `sqlite/better-sqlite3.ts:123` /
`sqlite/node-sqlite.ts:142` forward it as the driver's busy timeout. So:

- No `type_cast_config_to_integer`. A real `database.yml` yields whatever YAML
  parsed, commonly a string, and `AbstractAdapter.typeCastConfigToInteger` is
  already ported (`connection-adapters/abstract-adapter.ts:1880`) and used for
  `statementLimit` — it is simply not applied to `timeout`.
- No `TypeError` for a non-integer timeout.
- No `retries` key at all, so neither the `timeout`+`retries` `ArgumentError`
  nor the `retries` deprecation warning exists.

Surfaced during review of #5516, which added `timeout` to `buildAdapterArg`'s
sqlite whitelist so the option reaches the adapter at all. The whitelist is the
wrong place to cast — Rails' own config plumbing passes the hash through
untouched and the adapter owns the coercion — so the gap is recorded here.

Not urgent: the `arunit` entry sets `timeout: 5000` as a number
(`support/connection.ts`, `config.example.yml:84`), so nothing in the suite
feeds a string today.

## Acceptance criteria

- The sqlite adapter casts `timeout` with `typeCastConfigToInteger` before it
  reaches the driver, and raises `TypeError` when the result is not an integer,
  matching `sqlite3_adapter.rb:824-825`.
- `timeout` together with `retries` raises `ArgumentError` with Rails' message.
- `retries` alone emits the deprecation warning rather than being silently
  dropped.
- The coercion lives at the adapter (Rails' `configure_connection` site), not in
  `buildAdapterArg` — the other whitelisted keys stay uncast for the same
  reason.
