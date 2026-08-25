---
title: "Detect when both rubyMethodToTs spellings are defined (dead-override guard)"
status: draft
updated: 2026-07-31
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Rails predicate that maps to two accepted TS spellings can be defined under
BOTH spellings at once, and nothing catches it. `rubyMethodToTs("foo_exists?")`
returns `["isFooExists", "fooExists"]`, so parity:api happily matches either
candidate. If the base class defines `isFooExists` and a subclass defines
`fooExists`, they are different symbols: TypeScript reports no override error,
and every base-typed caller silently runs the base implementation while the
subclass body sits dead.

This has now shipped as a real bug twice:

- **#5736** — `data_source_exists?`: sqlite3/pg/mysql2 all had live-looking
  catalog queries that no base-typed caller ever reached. When the spellings
  were unified, two of the newly-live bodies were missing Rails'
  `if name.present?` gate (`abstract/schema_statements.rb:44`) and crashed on a
  null name.
- **#5752** — `index_name_exists?`: `PostgreSQLSchemaStatements#indexNameExists`
  (`postgresql/schema-statements-class.ts:257`) never overrode the base
  `isIndexNameExists`, so `removeIndex`'s `ifExists` path
  (`abstract/schema-statements.ts:517`) used the generic
  `indexes(table).some(...)` on PostgreSQL instead of PG's catalog query, which
  Rails does use (`postgresql/schema_statements.rb:68-83`).

Both were found by hand. The failure mode is silent by construction — no gate
looks for it, because each spelling is individually valid.

## Scope

Add a check that flags when two or more `rubyMethodToTs` candidate spellings for
the same Rails method are both present as definitions in the TS surface.

The extractor already has what this needs: `rubyMethodToTs` supplies the
candidate set, and the TS API extract (`scripts/api-compare/output/ts-api.json`)
lists every definition with its file and owning class. A pair is suspicious when
both spellings resolve to the same Rails method AND the owning classes are in an
inheritance relationship — that is precisely the dead-override case, as opposed
to two unrelated classes that merely happen to use different spellings.

## Acceptance criteria

- The check reports each Rails method for which two or more candidate spellings
  are defined, with the `file:line` of each definition.
- Inheritance-related pairs (base + subclass) are reported as errors; unrelated
  pairs may be advisory, since only the former is a dead override.
- Running it against `main` reports zero errors, or its current hits are
  triaged: either converged or recorded with per-entry reasons.
- Wired into whichever gate is appropriate (`parity:api` or a lint), with a
  note in the story if it is deliberately left advisory.
- `isTemplateExists` (`packages/actionview/src/view-paths.ts`) is the last known
  `is`-prefixed `*_exists?` predicate and is tracked separately by
  `actionview-template-exists-still-is-prefixed`; this guard should surface it
  if a bare `templateExists` also exists.

## Re-verified 2026-08-17 (draft sweep)

Still valid — no dual-spelling guard exists in `scripts/api-compare` or the
generated ESLint manifests. Worth pairing with
`detect-ported-adapter-overrides-never-wired-to-the-class`: both detect a ported
body that no caller reaches, by different mechanisms. Kept separate because the
detection differs (symbol-pair collision vs never-assigned export).
