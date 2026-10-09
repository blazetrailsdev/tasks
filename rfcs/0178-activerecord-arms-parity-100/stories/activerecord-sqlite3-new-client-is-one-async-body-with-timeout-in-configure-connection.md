---
title: "activerecord: SQLite3Adapter.new_client is one rescued body; busy timeout belongs to configure_connection"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: trails#8719
claim: "2026-10-09T18:09:42Z"
assignee: "activerecord-sqlite3-new-client-is-one-async-body-with-timeout-in-configure-connection"
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-3`, which made `SQLite3Adapter#connect` an `async` body that awaits `new_client` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:806-810`). `SQLite3Adapter.newClient` itself still reports `+if +if +try` in `pnpm parity:api:arms:report --package=activerecord --direction=invented`.

Rails (`sqlite3_adapter.rb:34-42`):

    def new_client(config)
      ::SQLite3::Database.new(config[:database].to_s, config)
    rescue Errno::ENOENT => error
      if error.message.include?("No such file or directory")
        raise ActiveRecord::NoDatabaseError
      else
        raise
      end
    end

The port (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, `static newClient`) differs in three places:

1. **A `rescue` closure shared by two paths.** It returns `SqliteConnection | Promise<SqliteConnection>` and picks `driver.openSync` or `driver.open(...).catch(rescue)`. Its only caller, `connect`, now awaits it, and `PostgreSQLAdapter.newClient` / `Mysql2Adapter.newClient` are already `static async`, so this can be `static async` with one `try` / `catch` and `await driver.open(openConfig)`. Every driver implements `open`; `openSync` (`packages/activerecord/src/sqlite-adapter.ts:161`) then has no adapter caller and wants deleting from the three drivers and the website's `sql-js-driver.ts`.
2. **The `timeout` ternary.** `openConfig.timeout` is `typeof timeout === "number" && Number.isInteger(timeout) ? timeout : undefined`. Rails does not pass a validated timeout at open at all: it hands `config` over as it is and sets the busy timeout in `configure_connection` (`sqlite3_adapter.rb:820-826`, `@raw_connection.busy_handler_timeout = timeout`), which trails' `configureConnection` validates but never applies. Moving it there removes the arm; check each driver (`better-sqlite3`, `node:sqlite`, libsql local and remote) accepts the busy timeout after open.
3. **Tests that pin the current shape.** `packages/activerecord/src/sqlite-adapter.trails.test.ts` asserts `SQLite3Adapter.newClient(params)` throws synchronously (`:634`) and that `timeout` is forwarded to `open()` (`:110-122`).

## Acceptance criteria

- [ ] `newClient` is one `try` with one typed `rescue` holding Rails' `if` / `else`, and no `rescue` closure.
- [ ] The busy timeout is applied in `configureConnection`, where `sqlite3_adapter.rb:826` applies it.
- [ ] `openSync` is deleted if nothing else calls it.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no row for `sqlite3-adapter.ts#newClient`.
