---
title: "mysql2-new-client-rescue-reads-resolved-config-keys"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

Rails' `Mysql2Adapter.new_client` rescue
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:26-39`) passes the
config keys straight to the error constructors:

```ruby
rescue ::Mysql2::Error => error
  case error.error_number
  when ER_BAD_DB_ERROR
    raise ActiveRecord::NoDatabaseError.db_error(config[:database])
  when ER_DBACCESS_DENIED_ERROR, ER_ACCESS_DENIED_ERROR
    raise ActiveRecord::DatabaseConnectionError.username_error(config[:username])
  when ER_CONN_HOST_ERROR, ER_UNKNOWN_HOST_ERROR
    raise ActiveRecord::DatabaseConnectionError.hostname_error(config[:host])
```

trails' `Mysql2Adapter.newClient` (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`) reads
`config.database ?? "unknown"`, `config.username ?? config.user ?? parseUriField(config, "username") ?? "unknown"`
and `config.host ?? parseUriField(config, "hostname") ?? "unknown"`. The fallbacks exist because a trails config
can carry node-mysql2's `uri` and `user` keys, which reach the adapter unresolved. In Rails a `url:` is resolved
into `host` / `username` / `database` by `ConnectionUrlResolver` before the adapter sees the hash
(`database_configurations/connection_url_resolver.rb`), so the three keys are always the ones to read.

`adapters/abstract-mysql-adapter/connection.test.ts` ("maps ER_ACCESS_DENIED_ERROR via URI to
DatabaseConnectionError with parsed username") pins the `parseUriField` arm.

Surfaced in review of trails#8728, which narrowed the rescue to `Mysql2::Error` but left the fallbacks.

## Acceptance criteria

- [ ] A MySQL config given as a `uri` / `url` is resolved into `host`, `username` and `database` before
      `newClient` runs, as `ConnectionUrlResolver` does.
- [ ] `newClient`'s rescue passes `config.database`, `config.username` and `config.host` with no fallback,
      and `parseUriField` is deleted.
- [ ] The URI test above still gets the parsed username, now from the resolved config.
