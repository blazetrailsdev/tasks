---
title: "to_sql_and_binds raises a TypeError where Rails' else arm never raises"
status: draft
updated: 2026-08-28
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`toSqlAndBinds`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`)
ends with

    throw new TypeError("Cannot convert to SQL");

Rails' `to_sql_and_binds`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:47-49`)
has no such raise. Its else arm accepts ANY value:

    arel_or_sql_string = arel_or_sql_string.dup.freeze unless arel_or_sql_string.frozen?
    [arel_or_sql_string, binds, preparable, allow_retry]

so a non-arel, non-String argument is returned untouched rather than raising.
trails' guard reaches the raise for anything that is neither a `Nodes.Node`, a
`SqlLiteral`, a JS string, nor duck-typed with `toSql()`.

Flagged during review of #7139 (RFC 0077) and deliberately left out of scope
there: that PR converged the compile branch (rb:20-46) and the raise predates
it. Note the surrounding duck-typed `toSql()` arm is also a trails widening with
no rb counterpart, so the two are best converged together.

## Acceptance criteria

- [ ] The unreachable-in-Rails `TypeError` is removed, or reduced to a
      documented TypeScript language shortcoming justified at the call site with
      the rb:47-49 cite (the return type is `[string, ...]`, and Rails' else arm
      can return a non-String).
- [ ] The duck-typed `toSql()` arm is converged or justified alongside it.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
