---
title: "activerecord: OID::Hstore#cast is an invented override; Rails inherits Type::Value#cast"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trails#8486. Rails' `OID::Hstore`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/hstore.rb:8-106`)
defines `type`, `deserialize`, `serialize`, `accessor`, `changed_in_place?` and the private `escape_hstore`.
It defines no `cast`, so `cast` is `Type::Value#cast` (`cast_value(value) unless value.nil?`), which answers a
Hash unchanged.

`packages/activerecord/src/connection-adapters/postgresql/oid/hstore.ts` adds a `cast` override that
round-trips the value through `serialize` then `deserialize` and answers `null` when the serialized form
is not a string. That stringifies every Hash value on assignment, where Rails keeps the assigned Hash until
it is serialized. `escapeHstore` in the same file also uses two early returns where `hstore.rb:94-104` has a
nested `if`/`else`.

## Acceptance criteria

- [ ] `Hstore` has no `cast` override; `adapters/postgresql/hstore.test.ts` passes on PostgreSQL, with any
      test that depended on the override converged to the Rails test body.
- [ ] `escapeHstore` has Rails' nested `if value.nil?` / `if value == ""` shape.
