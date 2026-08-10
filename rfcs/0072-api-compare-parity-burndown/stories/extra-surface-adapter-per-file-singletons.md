---
title: "extra-surface-adapter-per-file-singletons"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5918
claim: "2026-08-02T20:01:26Z"
assignee: "extra-surface-adapter-per-file-singletons"
blocked-by: null
closed-reason: null
---

## Context

Split out of `extra-surface-adapter-cross-file-recurring-names` (PR forthcoming)
to stay under the 500-LOC ceiling. That story resolved every **recurring**
adapter name — one decision each for `executeMutation`/`exec`, `Version`/`gte`,
`lookupCastType`/`nativeTypeMap`/`buildTypeMap`, `quoteIdentifier`,
`statementLimit`, `isNoDatabaseError`, `columnMethodNames`, `schemaStatements`,
`schemaQuery`, `schemaCacheBound`, `createRange`/`dropRange` — and cleared
`connection-adapters/abstract-adapter.ts` (14 novel to 0) and
`connection-adapters/abstract/quoting.ts` (3 to 0).

What remains is the per-file **singletons** on the three concrete adapters,
each declared in exactly one file, so none of them is a cross-file decision:

- `connection-adapters/abstract-mysql-adapter.ts` (5 novel): `addSqlComment`,
  `CLIENT_NOT_CONNECTED_RE`, `ER_TABLE_EXISTS`, `isClientNotConnected`,
  `setSessionVariable`.
- `connection-adapters/postgresql-adapter.ts` (9 novel): `detach`, `enumValues`,
  `resetPkSequence`, `serialFromDefaultFunction`, `setClientMinMessages`,
  `setPkSequence`, `setSchemaSearchPath`, `splitPgDefault`,
  `warmMaxIdentifierLength`.
- `connection-adapters/sqlite3-adapter.ts` (8 novel): `completeAsyncConnect`,
  `MAX`, `MIN`, `openAsync`, `pragma`, `strictStrings`, `whenClosed`,
  `withPreventedWrites`.

Notes carried over from the first pass:

- `addSqlComment` (abstract-mysql-adapter.ts:999) is the non-mutating twin of
  `addSqlCommentBang`, which DOES match Rails' `add_sql_comment!`
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`).
  Check whether the non-bang form has callers before allowlisting it — the
  first pass deleted several dead members (`verifyCalled`, `Version#major`/
  `#minor`/`#patch`, `SQLite3Adapter#nativeTypeMap`) rather than allowlist them.
- `ER_TABLE_EXISTS` (:177/:1412) and `CLIENT_NOT_CONNECTED_RE` (:1428) are
  SCREAMING_CASE class constants that survived the Ruby-constants tooling story
  because Rails has no matching `.rb` file constant (Rails writes MySQL error
  codes inline). Decide as constants, not methods.
- `MAX`/`MIN` on sqlite3-adapter.ts likewise survived the constants pass.
- Rails-private `_` prefix and TS `private`/`protected` both drop a member from
  the report with no allowlist entry; `@internal` JSDoc only works on top-level
  exported functions, not class members (see `collectTsFileNames` in
  `scripts/api-compare/extra-surface.ts`).

Reproduce with `pnpm parity:api && pnpm parity:api:extra --package activerecord --json`.

## Acceptance criteria

- One recorded decision per name above: delete (dead), rename toward the Rails
  name, make Rails-private (`_` prefix) or TS `private`/`protected`, or add a
  `@noRailsEquivalent PERMANENT <reason>` tag (`scripts/api-compare/extra-surface.ts:44-47`) anchored to a vendored
  Rails `file:line`. Note only irreducible surface gets a tag; convergeable surface stays
  counted and gets a story (#5342).
- Deviation justifications live at the declaration site, not only in the PR body.
- Novel counts for the three files go to 0; `pnpm parity:api:extra` reports no STALE
  allowlist entries.
- Adapter test files for each touched adapter pass (scoped `pnpm vitest run`
  only — not the full suite). MySQL/PG suites need a running server; if
  unavailable locally, say so and let CI verify.
- Record per-file novel before/after in the PR body.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
