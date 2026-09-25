---
title: "Mysql2Adapter#_rawConnection is private, so rawConnection() is typed unknown"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8076 typed `AbstractAdapter#rawConnection()` as `Promise<RawConnectionOf<Self>>` (`packages/activerecord/src/connection-adapters/abstract-adapter.ts`), which reads the driver-connection type off each adapter's `_rawConnection` accessor. That is what `raw_connection` returns (`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:798-804`). SQLite3 and PostgreSQL declare `_rawConnection` as a public `@internal` accessor, so their `rawConnection()` is typed as the driver connection. Mysql2Adapter declares it `private get _rawConnection(): mysql.Connection | null` (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:94`). A private member is invisible to the structural `A extends { _rawConnection: infer R }` check, so `Mysql2Adapter#rawConnection()` is typed `unknown`, and callers still cast.

## Acceptance criteria

- Mysql2Adapter's `_rawConnection` accessor matches the sqlite3/postgresql adapters' visibility (public, `@internal`), so `(await mysqlConn.rawConnection())` is typed `mysql.Connection | null` with no cast.
- Any `rawConnection()` cast at a mysql2 call site is dropped.
