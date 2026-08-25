---
title: "Fail when the canonical lay path touches an adapter member outside STUBBED_DDL_METHODS"
status: done
updated: 2026-07-31
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 5709
claim: "2026-07-31T15:03:06Z"
assignee: "pin-stubbed-ddl-set-against-canonical-lay-path"
blocked-by: null
closed-reason: null
---

## Context

The merged PR #5702 established the guarded set in
`packages/activerecord/src/support/stubbed-ddl-methods.ts` by tracing what
`loadCanonicalSchema` really goes through: `runTable` resolves a
`SchemaStatements` companion via `adapter.schemaStatements()`, lays each table
through it, renders DDL with `adapter.schemaCreation`, and reaches the database
with `adapter.execute`; `emitTableIndexes` adds `ss.addIndex`, and a `force:`
create drops first. The resulting set is `createTable`, `dropTable`, `addIndex`,
`execute`, `schemaCreation`, `schemaStatements`.

That trace is a point-in-time reading of `canonical-schema.ts` and
`connection-adapters/abstract/schema-statements.ts`. Nothing holds it true. If
`SchemaStatements.createTable` grows another adapter call on the lay path — the
way it already reaches for `getDatabaseVersion`, `schemaCache`,
`changeTableComment`, `quoteDefaultExpression` — the set silently goes stale, and
a cover intercepting the new member is back to laying nothing and dying with
`relation "…" does not exist` on the PG lane only. That is precisely the failure
this guard pair exists to prevent, and the shape it already failed at once
(PR #5676).

The two consumers are pinned to each other (the ESLint rule parses the array out
of the TS file; `eslint/no-load-schema-with-stubbed-ddl.test.mjs` pins the parse),
but nothing pins the list against the code it describes.

## Acceptance criteria

- A check that fails when the canonical lay path calls an adapter member outside
  `STUBBED_DDL_METHODS`. Likely shapes, cheapest first: a unit cover that drives
  `loadCanonicalSchema` against a recording Proxy and asserts the set of adapter
  members it touched is a subset of the guarded set plus a named, justified
  exempt list (`getDatabaseVersion`, `schemaCache`, `adapterName`, quoting
  helpers — reads and cache-busts, not DDL emission); or a lexical scan of
  `SchemaStatements`' lay-path methods for `this.adapter.<member>` calls.
- The exempt list carries a one-line reason per entry, so widening it is a
  deliberate act rather than a silent one.
- The check names the declaration site in its failure message, so the fix is
  obvious: add the member, or exempt it with a reason.
