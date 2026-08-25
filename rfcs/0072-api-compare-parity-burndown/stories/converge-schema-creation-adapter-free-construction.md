---
title: "converge-schema-creation-adapter-free-construction"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5938
claim: "2026-08-03T00:25:45Z"
assignee: "converge-schema-creation-adapter-free-construction"
blocked-by: null
closed-reason: null
---

## Context

`ABSTRACT_SCHEMA_QUOTER`
(`packages/activerecord/src/connection-adapters/abstract/quoting.ts:351`) is a
trails invention: an ANSI fallback `SchemaQuoter` used when a schema visitor or
table definition is constructed without a live adapter
(`connection-adapters/abstract/schema-creation.ts:50`,
`connection-adapters/abstract/schema-definitions.ts:1000`).

Rails has no such object. `SchemaCreation.new(conn)` always receives the real
adapter (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:6`)
and `TableDefinition#initialize` always receives a connection
(`.../abstract/schema_definitions.rb:369`). The fallback exists only because
trails allows adapter-free construction from the standalone `schemaCreation()`
convention helpers and isolated unit tests.

Classified during `extra-surface-classify-invented-adapter-constants`: tagged
`@noRailsEquivalent CONVERGEABLE` at the declaration site, citing this story.

## Acceptance criteria

- Every `SchemaCreation` / `TableDefinition` construction path supplies a real
  adapter (or the adapter-free path is removed), matching Rails' required
  `conn` argument.
- `ABSTRACT_SCHEMA_QUOTER` and its `@noRailsEquivalent` tag are deleted.
- activerecord novel count drops by one.
