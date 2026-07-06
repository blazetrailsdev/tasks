---
title: "Port adapter-scoped Type.register/Type.lookup so mysql2 string resolves via lookup"
status: ready
updated: 2026-07-06
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #4685 (mysql-string-type-registration-belongs-in-concrete-adapter).

Rails registers adapter-scoped cast types via `ActiveRecord::Type.register(name,
adapter:)` and resolves them with `Type.lookup(name, adapter:, **opts)`. For
mysql2 the `:string` type is registered as
`Type::String.new(true: "1", false: "0", **args)` (`mysql2_adapter.rb:194-196`),
and `Mysql2Adapter#initialize_type_map` (`mysql2_adapter.rb:40-49`) builds its
char/varchar/enum/set registrations by calling
`Type.lookup(:string, adapter: :mysql2, limit: limit)`.

trails has not ported the adapter-scoped `Type.register` / `Type.lookup`
registry. As a workaround, `Mysql2Adapter.initializeTypeMap`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`) constructs
the mysql2 string inline as
`new StringType({ trueString: "1", falseString: "0", limit })` instead of going
through `Type.lookup(:string, adapter: :mysql2)`. This equivalence is baselined
in `scripts/api-compare/call-mismatches-wide-exclude.json` (the
`connection-adapters/mysql2-adapter.ts` / `initialize_type_map` / `lookup`
entry).

Rails source:

- `vendor/rails/activerecord/lib/active_record/type.rb` — `Type.register` /
  `Type.lookup` with the `adapter:` keyword and the `Registry`/`AdapterSpecificRegistry`.
- `vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:40-49,194-196`.

## Acceptance criteria

- Port the adapter-scoped type registry (`Type.register(name, adapter:)` +
  `Type.lookup(name, adapter:, **opts)`), mirroring `active_record/type.rb`.
- Register the mysql2 `:string` type
  (`Type::String.new(true: "1", false: "0")`) via that registry and have
  `Mysql2Adapter#initializeTypeMap` resolve char/varchar/enum/set through
  `Type.lookup(:string, adapter: :mysql2, limit)` rather than the inline
  `new StringType(...)`.
- Remove the `connection-adapters/mysql2-adapter.ts` `initialize_type_map` /
  `lookup` entry from `call-mismatches-wide-exclude.json` once the real
  `lookup` call is present.
- No regression in api:compare / test:compare across mysql/mariadb CI; the
  `type_for_attribute(varchar_col).limit === 255` behavior is preserved.
