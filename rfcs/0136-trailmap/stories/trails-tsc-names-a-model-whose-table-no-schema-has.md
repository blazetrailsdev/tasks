---
title: "trails-tsc: warn when a model's table is in no schema file"
status: claimed
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 110
priority: 1
pr: null
claim: "2026-10-15T20:59:39Z"
assignee: "trails-tsc-names-a-model-whose-table-no-schema-has"
blocked-by: null
closed-reason: null
---

## Context

`renderSchemaColumnDeclares`
(`packages/activerecord-cli/src/type-virtualization/synthesize.ts`) returns
`[]` when the model's table is in no schema: `const cols = map[table]; if
(!cols) return [];`. Nothing is reported.

Measured on trailmap, whose stats models (`PullRequest`, `CompareRun`, the
five `*Stat` classes) read a database whose schema another repository owns, so
no schema file in trailmap describes them:

- With hand-written `declare`s the model keeps working exactly as before —
  existing members always win.
- With the declares deleted the model is NOT silently `any`: `Base` has no
  index signature, so `pr.merge_commit_sha` is TS2339 at every use site.
- But a model nobody reads a column from type-checks clean with no members at
  all, and nothing says its table was not found. The same silence covers the
  ordinary mistakes: a schema file not re-dumped after a migration, a
  `tableName` the walker cannot read (it sees only a `static tableName =
"…"` initializer, not `static { this.tableName = … }` nor trailmap's
  `static _tableName`), or a `--schema` path pointing at the wrong database.

## Acceptance criteria

- When a schema is loaded and a concrete (non-abstract) virtualized model's
  table is in none of the schema files, `trails-tsc` writes one warning line
  per model to stderr naming the class, the table name it looked for, and the
  file. It is a warning, not an error: exit status is unchanged.
- A model opts out with the existing `@trails-typegen skip` class comment, or
  a new `@trails-typegen no-schema` marker if `skip` (which also suppresses
  association/scope/enum synthesis) is too broad — decide by checking what
  trailmap's stats models lose under `skip`.
- An abstract class (`this.abstractClass = true` in a static block) is never
  warned about.
- The walker also reads `this.tableName = "…"` from a static block, so the
  warning does not fire for a model that named its table the Rails way.
- Tests cover: warned, opted out, abstract, static-block table name.
