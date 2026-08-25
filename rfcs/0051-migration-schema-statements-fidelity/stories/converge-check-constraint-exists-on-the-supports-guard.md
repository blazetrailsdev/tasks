---
title: "converge-check-constraint-exists-on-the-supports-guard"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5824
claim: "2026-08-01T19:39:04Z"
assignee: "converge-check-constraint-exists-on-the-supports-guard"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#checkConstraintExists`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`)
wraps its `checkConstraints(tableName)` call in a try/catch that swallows
`NotImplementedError` and returns `false`. Rails has no such rescue.

Rails reaches the same place through `check_constraint_for`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1797`),
which opens with `return unless supports_check_constraints?` — an unsupported
adapter never calls `check_constraints` and so never reaches the raise.
`check_constraint_exists?` (`:1341`) is then just an argument check plus
`check_constraint_for(...).present?`.

trails also has no `checkConstraintFor` seam: `checkConstraintExists` inlines the
detect loop, matching `name` or `expression` directly instead of routing through
`check_constraint_name` + `defined_for?`.

Found during review of
`remove-schema-statements-dispatch-shim-companion-mixin-duality` (PR #5812),
which fixed the immediate symptom — the catch had been sniffing
`e.message.startsWith("NotImplementedError")`, which could never match a real
`NotImplementedError` thrown with no message — and left the invented rescue in
place.

## Acceptance criteria

- `checkConstraintFor` / `checkConstraintForBang` exist and mirror
  `schema_statements.rb:1797-1806`, including the
  `return unless supports_check_constraints?` guard.
- `checkConstraintExists` becomes Rails' argument check plus
  `checkConstraintFor(...)` presence test; the try/catch around
  `checkConstraints` goes away.
- Matching routes through `checkConstraintName` + `defined_for?` rather than the
  inlined name/expression comparison.
- SQLite, MySQL and PostgreSQL lanes green.
