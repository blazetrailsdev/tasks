---
title: "SqlLiteral hash-keyed order should be reversible (not trigger dangerousQueryCheck)"
status: ready
updated: 2026-07-05
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/relations_test.rb:343` — `Topic.order(Arel.sql("REPLACE(title, '', '')") => :asc).reverse_order` should not raise, because the hash form carries explicit direction information that AR can reverse.

Rails' `SqlLiteral` extends `String`, so `{ Arel.sql(...) => :asc }` is a hash with a String-subclass key. Trails' `SqlLiteral` is a separate class (not a String subclass), so `{ [arelSql(...)]: "asc" }` produces a computed property key via `toString()` which hits `UnknownAttributeReference` (dangerousQueryCheck).

Surfaced in `relations.test.ts` canonical port (PR #4215); test is currently skipped.

`packages/activerecord/src/relations.test.ts` — skip: "SqlLiteral is not a String subclass so hash-keyed Arel SQL order lacks explicit-direction signal"

## Acceptance criteria

- `Topic.order({ [arelSql("REPLACE(title,'','')"]  : "asc" }).reverseOrder()` (or equivalent API) does not throw
- `order()` recognises a `SqlLiteral` key as a trusted, direction-carrying column expression (bypasses dangerousQueryCheck, can be reversed)
- The skip on `reverse arel assoc order with multiargument function` in `relations.test.ts` is removed
