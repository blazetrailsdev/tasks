---
title: "SQLite3Adapter#connect is one new_client body; delete connectAsync/driverIsAsync"
status: in-progress
updated: 2026-09-25
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: trails#8082
claim: "2026-09-25T13:29:26Z"
assignee: "sqlite3-connect-single-body-via-new-client"
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter#connect` (`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:806-810`) is one body: `@raw_connection = self.class.new_client(@connection_parameters)`, rescuing `ConnectionNotEstablished` into `ex.set_pool(@pool)`.

trails' `connect` (`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) branches on the private, trails-only `driverIsAsync()`. When the driver is async it calls a second private, trails-only `connectAsync()` that repeats the same body with `await`. `SQLite3Adapter.newClient` already dispatches sync vs. async itself: `if (!driver.openSync) return driver.open(openConfig).catch(rescue)`. So the split just duplicates `newClient`.

After trails#8052, `driverIsAsync` has no caller except `connect`.

## Acceptance criteria

- `connect` is the single Rails body. It assigns `newClient(this._connectionParameters)`, awaiting it when `newClient` answers a Promise, and rescues `ConnectionNotEstablished` into `setPool(this.pool)`.
- `connectAsync` and `driverIsAsync` are deleted.
- The `sqlite-drivers` lane stays green, including the async-only driver's first-query open and "opens once when several queries race the deferred async-only open".
