---
title: "converge-call-rows-unmasked-by-resolved-interface-params"
status: in-progress
updated: 2026-09-29
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8248
claim: "2026-09-29T19:42:33Z"
assignee: "converge-call-rows-unmasked-by-resolved-interface-params"
blocked-by: null
closed-reason: null
---

## Context

`extractor-resolved-interface-members-carry-empty-params` taught
`scripts/api-compare/extract-ts-api.ts` to copy a resolved interface member's
real parameter list instead of `params: []`. That unmasked call-set rows
(`pnpm parity:api:calls`) that the empty signatures had hidden. Each row below is
a TS body that omits a call its Rails body makes. They were baselined in the same
PR so it could land, with reasons pointing here:

- activemodel `model.ts` `initialize` omits `assign_attributes`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb`, `initialize`).
- activerecord `connection-adapters/postgresql/schema-creation.ts`
  `visit_UniqueConstraintDefinition`: call order `quote_column_name`, `map`
  (`activerecord/lib/active_record/connection_adapters/postgresql/schema_creation.rb`).
- activerecord `connection-adapters/postgresql/schema-statements.ts`
  `change_column_null`: call order `quote_table_name`, `column_for`
  (`postgresql/schema_statements.rb`).
- activerecord `relation/query-attribute.ts` `initialize` omits `mutable?`
  (`relation/query_attribute.rb`).
- trailties `application/routes-reloader.ts` `execute_unless_loaded` omits
  `application` (`railties/lib/rails/application/routes_reloader.rb:37-43`
  reads `Rails.application`; trails takes it as a parameter).
- trailties `command/actions.ts` `boot_application!` omits `application`
  (`railties/lib/rails/command/actions.rb:18-21`,
  `Rails.application.require_environment! if defined?(APP_PATH)`; trails calls
  `Trails.initialize()`).

## Acceptance criteria

- Each body makes the call Rails makes, in Rails' order.
- Its row is deleted from `scripts/api-compare/call-mismatches-exclude/`, and the
  mark is narrowed with `pnpm parity:api:calls:tighten`.
