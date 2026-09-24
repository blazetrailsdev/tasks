---
title: "Sanitization: replace_bind_variable checks ActiveRecord::Relation === value, not a toSql/toArray duck type"
status: claimed
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-09-24T21:48:41Z"
assignee: "sanitization-replace-bind-variable-relation-check"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8049 (sanitization-signatures-onto-rails). Rails'
`replace_bind_variable` (`vendor/rails/activerecord/lib/active_record/sanitization.rb:211-217`)
checks `ActiveRecord::Relation === value` before calling `value.to_sql`.

trails (`packages/activerecord/src/sanitization.ts`, `replaceBindVariable`) calls an invented
`isRelationLike` helper instead. The helper duck-types on `typeof toSql === "function" && typeof toArray === "function"`,
so any object with both methods is inlined as raw SQL, and it adds a public name Rails does not have.
`ActiveRecord.Relation` is already autoloaded on the namespace object (`packages/activerecord/src/namespaces.ts`,
see CLAUDE.md § "Call-time constant resolution"), so the Rails check can be read at call time without an import cycle.

## Acceptance criteria

- `replaceBindVariable` tests `value instanceof ActiveRecord.Relation!` (the call-time `Relation ===`), then `value.toSql()`, else `quoteBoundValue(connection, value)`.
- `isRelationLike` is deleted.
- `sanitize.test.ts` ("sanitize sql array handles relations") stays green on all three adapters.
