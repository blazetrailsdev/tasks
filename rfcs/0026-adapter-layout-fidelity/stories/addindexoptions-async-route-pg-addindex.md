---
title: "Make addIndexOptions async and route PG addIndex through it"
status: claimed
updated: 2026-06-15
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-15T14:16:02Z"
assignee: "addindexoptions-async-route-pg-addindex"
blocked-by: null
---

## Context

Surfaced finishing `pg-indexes-rails-fidelity` (#3340). Rails' PostgreSQL
`add_index_options` override (`activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:937-942`)
quotes a bare-column-name `:where` by calling `column_exists?` — a DB
introspection call. In Rails that's synchronous; in this port `columnExists` /
`tableExists` are **async**.

Current TS state:

- Base `addIndexOptions` (`abstract/schema-statements.ts:1614`) is **sync**,
  returns `[IndexDefinition, string|undefined, boolean]`.
- Sync call sites: base `addIndex` (`abstract/schema-statements.ts:1379`) and
  MySQL `buildCreateIndexDefinition` (`abstract-mysql-adapter.ts:931`).
- PG `addIndexOptions` (`postgresql-adapter.ts:4671`) is a stub with the **wrong
  signature** — returns `{ ...options }` (a `Record`), not the base tuple — and
  overrides nothing meaningful.
- PG `addIndex` (`postgresql-adapter.ts:3640`) is bespoke: builds SQL inline,
  **never routes through `addIndexOptions`**. Because `addIndexOptions` is sync
  and unused on the PG path, #3340 had to inline the where-quoting + a
  `/^\w+$/` guard directly in `addIndex` (see the comment block there) instead
  of housing it in the override like Rails does.

This story converges to Rails' structure: make `addIndexOptions` async and route
PG `addIndex` through it, moving the where-quoting/`columnExists` logic into the
PG `addIndexOptions` override where Rails keeps it.

## Scope

- Make base `addIndexOptions` `async` (return
  `Promise<[IndexDefinition, string|undefined, boolean]>`).
- Update all call sites to `await`: base `addIndex` (`:1379`), MySQL
  `buildCreateIndexDefinition` (`:931`), and any others surfaced by the type
  checker.
- Give PG `addIndexOptions` the correct (async) signature matching the base, and
  move the bare-column-name `:where` quoting (`tableExists` + `columnExists` →
  `quoteColumnName`) into it.
- Route PG `addIndex` through `addIndexOptions` and drop the inline guard added
  in #3340.

NOTE: This story does NOT change PG `addIndex`'s `Promise<string>` return type
(the `@ts-expect-error TS2416` at `postgresql-adapter.ts:3639`) — that
return-type harmonization is tracked separately so tests asserting on the
returned SQL aren't churned here.

## Acceptance criteria

- [ ] `addIndexOptions` is async across base + all adapter overrides; every call
      site awaits it.
- [ ] PG `addIndex` routes through `addIndexOptions`; no inline `/^\w+$/` guard
      remains in `addIndex`.
- [ ] Bare-column-name `:where` quoting lives in PG `addIndexOptions`, matching
      Rails `schema_statements.rb:937-942`; expression `:where` values pass
      through verbatim (no unescaped value reaches `columnExists`).
- [ ] api:compare / test:compare delta non-negative; existing PG add-index
      tests (incl. #3340's where-quoting cases) still pass.
