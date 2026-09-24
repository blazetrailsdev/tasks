---
title: "sanitize-sql-alias-of-for-conditions"
status: draft
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8049 (sanitization-signatures-onto-rails). In
`vendor/rails/activerecord/lib/active_record/sanitization.rb:33-40`,
`sanitize_sql_for_conditions` is the single body
(`return nil if condition.blank?`, then `case condition when Array; sanitize_sql_array(condition) else condition end`),
and `sanitize_sql` is `alias :sanitize_sql :sanitize_sql_for_conditions`.

trails (`packages/activerecord/src/sanitization.ts`) inverts this: `sanitizeSql` carries the body,
and `sanitizeSqlForConditions` re-checks `isBlankCondition` and then calls `this.sanitizeSql`.
The invented `isBlankCondition` helper stands in for ActiveSupport `blank?` (`isBlank`).
`sanitize.trails.test.ts` has tests that pin the inverted dispatch
("sanitizeSqlForConditions dispatches through this.sanitizeSql", "sanitizeSql dispatches through this.sanitizeSqlArray").

## Acceptance criteria

- `sanitizeSqlForConditions` holds the Rails body (`:33-38`), using `isBlank` from activesupport rather than `isBlankCondition`.
- `sanitizeSql` is the alias (the same function assigned under both names in `ClassMethods`), following the repo's alias idiom.
- The trails tests that pin the inverted dispatch are rewritten or removed. `sanitize.test.ts` stays green on all three adapters.
