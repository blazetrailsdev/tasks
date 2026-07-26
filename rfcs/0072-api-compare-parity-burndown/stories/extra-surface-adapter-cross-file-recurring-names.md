---
title: "extra-surface: one decision per adapter name recurring across five adapter files"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps:
  [
    "extra-surface-allow-ruby-file-constants",
    "extra-surface-honor-internal-jsdoc-on-file-functions",
  ]
deps-rfc: []
est-loc: 220
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). Once per-file counts are read side by side, a set of names
recurs across **five** adapter files, which means each is one decision that
resolves five reports — not five separate problems.

Files and their novel counts (`pnpm api:extra --package activerecord`):
`connection-adapters/abstract-adapter.ts` 15,
`connection-adapters/abstract-mysql-adapter.ts` 30,
`connection-adapters/postgresql-adapter.ts` 19,
`connection-adapters/sqlite3-adapter.ts` 14,
`connection-adapters/abstract/quoting.ts` 12.

The recurring names, grouped by decision:

- **execute/executeMutation split** — `executeMutation` (abstract-adapter,
  postgresql-adapter, sqlite3-adapter) and `exec` (postgresql-adapter,
  sqlite3-adapter, migration.ts). Rails has a single `execute`; the split is
  a known, deliberate trails deviation and needs one written justification
  reused at each site, not per-file ad-hockery.
- **Version object** — `Version`, `major`, `minor`, `gte` (abstract-adapter,
  abstract-mysql-adapter, connection-adapters.ts). Rails uses `Gem::Version`
  and `database_version`. One decision: allowlist the shim or fold it into a
  shared module whose Rails home is declared.
- **Type-map plumbing** — `lookupCastType` (abstract-mysql-adapter,
  sqlite3-adapter, abstract/quoting.ts), `nativeTypeMap`
  (abstract-mysql-adapter, sqlite3-adapter), `buildTypeMap`
  (abstract-mysql-adapter). Rails: `initialize_type_map` /
  `lookup_cast_type` live in `abstract_adapter.rb` and the per-adapter
  `*_adapter.rb`; check whether these are (c) misplaced ports before
  allowlisting.
- **Quoting** — `quoteIdentifier` (abstract-adapter, abstract-mysql-adapter,
  abstract/quoting.ts, connection-adapters.ts). Rails' abstract quoting has
  `quote_column_name` / `quote_table_name`; `quote_identifier` does not
  exist. Decide once: rename to a Rails name or allowlist.
- **Schema plumbing** — `schemaStatements`, `schemaQuery`, `schemaCacheBound`,
  `verifyCalled`, `columnMethodNames` (abstract-adapter and
  postgresql/mysql), `createRange` / `dropRange` (abstract-adapter,
  postgresql-adapter — PG-only DDL surfaced on the abstract base),
  `isNoDatabaseError` (all three concrete adapters + abstract),
  `statementLimit` (all three concrete adapters).

Per-file singletons that ride along and should be decided in the same pass:
`addSqlComment`, `isClientNotConnected`, `setSessionVariable`,
`parseTableOptions` (mysql); `detach`, `enumValues`, `resetPkSequence`,
`setPkSequence`, `setClientMinMessages`, `setSchemaSearchPath`,
`splitPgDefault`, `serialFromDefaultFunction`, `warmMaxIdentifierLength` (pg);
`completeAsyncConnect`, `openAsync`, `pragma`, `strictStrings`, `whenClosed`,
`withPreventedWrites` (sqlite3); the ten `dispatch*` helpers plus
`isSqlLiteral` and `toBytes` (abstract/quoting.ts — all already `@internal`,
see that tooling story).

Sequencing: the SCREAMING*CASE constants on these same files
(`ER*\_`, `CR\_\_`, `NATIVE_DATABASE_TYPES`, `MAX`, `MIN`, `TYPE`) are covered by
the Ruby-constants tooling story and the `@internal`ones by the
fileFunctions story — land both first and re-run`pnpm api:extra --package activerecord --json` so this story works from the
reduced list (abstract-mysql-adapter should already be down from 30 to ~13).

## Acceptance criteria

- One recorded decision per recurring name above, applied consistently across
  every file that declares it: rename toward the Rails name, mark `@internal`,
  or add a `scripts/api-compare/extra-surface-allow.json` entry with a written
  reason. No name resolved two different ways on two adapters.
- Deviation justifications live at the declaration site, not only in the PR
  body — `execute`/`executeMutation` in particular needs the reason stated
  once at the abstract-adapter declaration and referenced from the concrete
  adapters.
- `createRange` / `dropRange` on `abstract-adapter.ts`: confirm whether the
  PG-only DDL genuinely belongs on the abstract base or should move to
  `postgresql-adapter.ts` / `postgresql/schema-statements.ts`.
- Adapter test files for each touched adapter pass
  (`pnpm vitest run` scoped to those files only — do not run the full suite).
  MySQL/PG suites need a running server; if unavailable locally, say so and
  let CI verify.
- Record per-file novel before/after for all five files in the PR body.
- 500 LOC ceiling: if the five files don't fit one PR, ship the shared
  decisions (abstract-adapter + quoting) and register the concrete adapters as
  a new story. Do NOT open sibling PRs.
