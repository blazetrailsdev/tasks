---
title: "converge-schema-statements-not-implemented-bodies"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5840
claim: "2026-08-02T00:01:04Z"
assignee: "converge-schema-statements-not-implemented-bodies"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements`' two "unsupported adapter" bodies diverge from Rails:

- `foreignKeys` (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`)
  returns `[]` where Rails raises
  `NotImplementedError, "foreign_keys is not implemented"`
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1103`).
- `checkConstraints` throws a plain `Error("NotImplementedError: …")` where Rails
  raises a bare `NotImplementedError` (`:1273`).

`remove-schema-statements-dispatch-shim-companion-mixin-duality` (PR #5812) tried
to converge both and had to back it out: `introspectForeignKeys`
(`packages/activerecord/src/schema-introspection.ts:156`) is built on the `[]`
and documents it ("`[]` is the honest answer for unsupported adapters"), and
`schema-introspection.trails.test.ts:305` pins it — the SQLite, MariaDB and
PostgreSQL lanes all failed on that one test.

`schema-introspection.ts` is trails-only infra with no Rails counterpart, so the
convergence is really a question about that helper, not about
`SchemaStatements`.

## Acceptance criteria

- `foreignKeys` raises `NotImplementedError("foreign_keys is not implemented")`
  and `checkConstraints` raises a bare `NotImplementedError`, both carrying the
  `@nie` disposition marker the lint autofix adds.
- `introspectForeignKeys` and its `hasForeignKeys` guard are re-derived against
  what actually calls them: either the caller handles "adapter cannot report
  FKs" explicitly, or the helper goes away in favour of `adapter.foreignKeys`.
- `schema-introspection.trails.test.ts`'s
  "returns [] from the SchemaStatements fallback when adapter lacks foreignKeys()"
  case follows whatever that decision is.
- SQLite, MySQL and PostgreSQL lanes green.
