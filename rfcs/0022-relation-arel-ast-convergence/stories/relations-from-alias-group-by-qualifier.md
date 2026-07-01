---
title: "from(rel, alias) generates wrong table qualifier in GROUP BY (uses original table, not alias)"
status: ready
updated: 2026-06-27
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/relations_test.rb:197,206,215` — three tests assert that `Comment.from("(#{relation.to_sql}) grouped_comments").group("type")` uses the alias `grouped_comments` in the GROUP BY, not the original table name `comments`.

Trails' `from(rel, alias)` generates `GROUP BY "comments"."type"` (original table qualifier) instead of `GROUP BY "grouped_comments"."type"` (alias). Surfaced in `relations.test.ts` canonical port (PR #4215); all three variants are skipped.

Tests:

- `group with subquery in from does not use original table name`
- `select with subquery string in from does not use original table name`
- `group with subquery string in from does not use original table name`

`packages/activerecord/src/relations.test.ts` — 3 skips referencing canonical `comments` STI `type` column / from() alias

## Acceptance criteria

- `from(subquery, alias)` qualifies GROUP BY and ORDER BY with the alias, not the original table name
- All three skipped tests in `relations.test.ts` pass
