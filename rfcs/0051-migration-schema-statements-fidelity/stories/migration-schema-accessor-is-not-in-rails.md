---
title: "Migration#schema accessor has no Rails counterpart"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5851
claim: "2026-08-02T01:35:44Z"
assignee: "migration-schema-accessor-is-not-in-rails"
blocked-by: null
closed-reason: null
---

## Context

PR #5847 reduced `Migration#schema`
(`packages/activerecord/src/migration.ts:326`) to
`assertSchemaAdapter(this.connection); return this.connection`. Rails'
`ActiveRecord::Migration` has no `schema` accessor at all — DDL bodies reach
the adapter through `connection` (`migration.rb:1036`), and the schema
statements are adapter instance methods via `include SchemaStatements`
(`abstract_adapter.rb:35`). The accessor is now a pure trails-only alias for
`connection` plus a runtime assertion Rails does not make.

## Acceptance criteria

- `Migration#schema` is deleted; its call sites use `this.connection`.
- `assertSchemaAdapter` is not reintroduced at those call sites unless a
  concrete adapter shape genuinely requires narrowing (record the reason at
  the call site if so).
- `parity:api` / `parity:test` delta non-negative.
