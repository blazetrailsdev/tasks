---
title: "activerecord: Mysql2Adapter#initialize sets FOUND_ROWS on @config[:flags] as Rails does"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`Mysql2Adapter#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:55-68`) is

```ruby
def initialize(...)
  super

  @affected_rows_before_warnings = nil
  @config[:flags] ||= 0

  if @config[:flags].kind_of? Array
    @config[:flags].push "FOUND_ROWS"
  else
    @config[:flags] |= ::Mysql2::Client::FOUND_ROWS
  end

  @connection_parameters ||= @config
end
```

`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`'s constructor carries `@missingRailsCall push`. It has none of those statements: it parses a URL string, destructures a dozen option keys Rails leaves in `@config`, and writes `flags: ["FOUND_ROWS"]` into a separate `_poolConfig` at three sites, one per argument shape. `@config[:flags]` is never set, so `@connection_parameters ||= @config` has nothing to carry.

The URL arm has no Rails counterpart at this layer (`DatabaseConfigurations` resolves a URL into a hash before an adapter is built), and the option translation for the npm client belongs where Rails hands `@connection_parameters` to the driver, `Mysql2Adapter.new_client` (`mysql2_adapter.rb:23-37`).

## Acceptance criteria

- [ ] The constructor is `super(...)` followed by Rails' statements in Rails' order: `_affectedRowsBeforeWarnings`, the `flags ||= 0` default, the Array / Integer arms, and `_connectionParameters ||= _config`.
- [ ] Translating `@connection_parameters` for the mysql2 npm client happens in `newClient` (or the driver wrapper it calls), and the URL-string constructor arm is gone or resolved before the adapter is built.
- [ ] The `@missingRailsCall push` receipt is deleted; `pnpm parity:api:calls` and `pnpm parity:api:arms:report --package=activerecord` show no row for the constructor.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts
```
