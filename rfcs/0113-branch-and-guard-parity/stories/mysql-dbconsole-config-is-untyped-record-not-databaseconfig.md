---
title: "dbconsole takes an untyped Record where Rails takes a DatabaseConfig, forcing a guard rb:80 lacks"
status: ready
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 26
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:56-82`
takes a **`DatabaseConfig`**, and reads two different things off it:

```ruby
def dbconsole(config, options = {})
  mysql_config = config.configuration_hash      # :56-57  -> the flag map
  ...
  args << config.database                       # :80     -> the positional
  find_cmd_and_exec(ActiveRecord.database_cli[:mysql], *args)
end
```

trails (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:942`)
flattens both onto one untyped bag:

```ts
static dbconsole(
  config: Record<string, unknown>,
  options: Record<string, unknown> = {},
): string[]
```

Two consequences, both live:

1. **`config.database` is optionally-present**, so `args << config.database`
   (`rb:80`, unconditional) could push a literal `undefined`. PR #7270
   (`mysql-dbconsole-database-pushed-unconditionally`) converged the _bare
   truthiness_ guard to a null-guard — `if (config.database !== undefined)` —
   which is the closest a loose `Record` allows, but it is still a guard
   `rb:80` does not have. Rails cannot reach that branch because
   `DatabaseConfig#database` is a declared reader.
2. **The flag map reads the wrong object.** trails reads `config.host` /
   `config.port` / `config.socket` / `config.username` / `config.ssl*`
   straight off `config`, where `rb:57-72` reads them off
   `config.configuration_hash`. That happens to work only because the caller
   passes a flattened hash.

`AbstractAdapter.dbconsole` (`abstract-adapter.ts:1724`) is
`(_config?: unknown, _options?: unknown)`, so the looseness is inherited, not
local to MySQL.

## Converged shape

`dbconsole` takes trails' `DatabaseConfig` (the port of
`ActiveRecord::DatabaseConfigurations::DatabaseConfig`), reads the flag map
from `configurationHash` as `rb:57` does, and pushes `config.database`
**unconditionally** as `rb:80` does — the guard disappears because the reader
is declared, exactly as in Ruby. The sqlite3 and postgresql `dbconsole`
overrides take the same parameter type.

## Acceptance criteria

- [ ] `dbconsole`'s `config` parameter is the `DatabaseConfig` type, not
      `Record<string, unknown>`, on the abstract and all three adapters.
- [ ] The flag map is built from `configurationHash` (`rb:57`), not from the
      config object's own properties.
- [ ] `args.push(config.database)` carries no presence/undefined guard.
- [ ] `dbconsole-option-keys.trails.test.ts` still covers the empty-string
      database case landed by #7270.
