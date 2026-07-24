---
title: "ar-pg-oid-type-registrations-not-adapter-scoped"
status: claimed
updated: 2026-07-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps:
  - ar-resolve-type-name-unwired-attribute-path-adapter-blind
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-24T02:03:17Z"
assignee: "ar-pg-oid-type-registrations-not-adapter-scoped"
blocked-by: null
closed-reason: null
---

## Context

Rails registers the PostgreSQL OID types adapter-scoped
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:1168-1185`,
e.g. `ActiveRecord::Type.register(:money, OID::Money, adapter: :postgresql)`),
so `attribute :col, :money` resolves only on a PostgreSQL model.

PR for `ar-resolve-type-name-unwired-attribute-path-adapter-blind` moved these
out of ActiveModel's `typeRegistry` into ActiveRecord's `AdapterSpecificRegistry`
(`packages/activerecord/src/connection-adapters/postgresql/type-map-init.ts`),
but deliberately registered them **unscoped** (`{ override: false }`) rather than
`{ adapter: "postgres" }`. Reason documented at the call site: PG-only tests
declare `attribute(..., "interval" | "uuid")` on models that carry a per-model
adapter (e.g. `adapters/postgresql/datatype.test.ts:45-53`,
`adapters/postgresql/uuid.test.ts:347`), where `connectionDbConfig()` raises
`ConnectionNotEstablished` and `Type.adapterNameFrom` degrades to `"sqlite"` —
an adapter-scoped registration would turn those declarations into
`Unknown type :interval`.

Rails' own list also includes `binary` (OID::Bytea), `date`, `datetime`,
`decimal`, `enum`, `legacy_point` and `vector`, none of which trails registers.

## Acceptance criteria

- The PG OID registrations in `type-map-init.ts` carry `{ adapter: "postgres" }`,
  matching postgresql_adapter.rb:1168-1185, and the deviation comment is deleted.
- `Type.adapterNameFrom` resolves to `"postgres"` for models under a PG
  connection including the per-model-adapter shape used by the PG test files, or
  those tests are reworked so they no longer depend on the fallback.
- PG CI stays green (`adapters/postgresql/*.test.ts`, notably datatype, uuid,
  hstore, money, interval, network, range).
- Types registered by Rails but missing in trails are either added or listed with
  a reason.
