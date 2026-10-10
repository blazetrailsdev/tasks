---
title: "activerecord: @raw_connection is one field; the npm client is wrapped where it is created"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' adapters hold the driver connection in `@raw_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:774`,
`@raw_connection = @unconfigured_connection` in `verify!`). In trails the field is
`AbstractAdapter#_connection`, and `_rawConnection` is an accessor over it: one on `AbstractAdapter`
(added by trails#8744 so `verifyBang` seats through the subclass setter), and one each on
`Mysql2Adapter`, `PostgreSQLAdapter` and `SQLite3Adapter`. The Mysql2 and PostgreSQL setters also wrap
the npm client (`mysql2Client(value)`, `pgConnection(value)`) and PostgreSQL's bumps
`_acquireGeneration`, so an assignment does work Rails' ivar write does not, and a write to
`_connection` silently skips it. That bypass is the bug trails#8744 fixed in `verifyBang`.

## Acceptance criteria

- [ ] The ivar is one field named `_rawConnection`; `_connection` is gone from the adapters.
- [ ] The npm client is wrapped where it is created (`Mysql2.Client.new`, the PostgreSQL connect path)
      and where a caller hands one to the constructor, not in a setter, so
      `this._rawConnection = x` is a plain write as `@raw_connection = x` is.
- [ ] `mysql2-adapter.verify-unconfigured-connection.trails.test.ts` still passes.
