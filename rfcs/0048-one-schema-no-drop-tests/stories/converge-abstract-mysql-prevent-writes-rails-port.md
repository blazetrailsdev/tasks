---
title: "converge-abstract-mysql-prevent-writes-rails-port"
status: in-progress
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4336
claim: "2026-06-30T17:02:41Z"
assignee: "converge-abstract-mysql-prevent-writes-rails-port"
blocked-by: null
---

## Context

Faithful Rails port of
`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/adapter_prevent_writes_test.rb`
into `packages/activerecord/src/adapters/abstract-mysql-adapter/adapter-prevent-writes.test.ts`.
The 13 trails it-names already match Rails verbatim, but the suite (1) creates a
bespoke inline `engines` table instead of riding canonical engines, and (2) pokes
`adapter.pool.preventWrites` directly instead of wrapping in
`Base.whilePreventingWrites(...)` the way Rails uses
`ActiveRecord::Base.while_preventing_writes do ... end`. Converge: ride canonical
engines, and wire the standalone Mysql2Adapter to Base's connection so
`Base.whilePreventingWrites` actually gates it (impl gap — the test builds a raw
adapter not attached to Base's pool, which is why the prior author poked the pool).

Split from converge-mysql-adapter-ddl-one-schema.

## Acceptance criteria

- [ ] Use Base.whilePreventingWrites, not direct pool.preventWrites poking.
- [ ] Ride canonical engines; no bespoke inline CREATE TABLE.
- [ ] it-names stay verbatim; assertions mirror Rails.
- [ ] Fix impl or file 0023-surfaced-deviations for the adapter/Base wiring gap.
- [ ] All-or-nothing, <500 LOC.
