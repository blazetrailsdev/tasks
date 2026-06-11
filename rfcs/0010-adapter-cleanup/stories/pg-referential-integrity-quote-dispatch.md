---
title: "PG referential-integrity SQL: dispatch quoting through the adapter instance"
status: in-progress
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 80
pr: 3126
claim: "2026-06-11T18:24:05Z"
assignee: "pg-referential-integrity-quote-dispatch"
blocked-by: null
priority: 1
---

## Context

From the `drop-legacy-crutches` audit (Q1). In Rails, `ConnectionAdapters::Quoting`
helpers are instance methods on the adapter, so per-adapter behavior is selected
by normal dispatch. trails already exposes them as real instance methods on
`AbstractAdapter` + concrete adapters (with `override`), backed by
single-source-of-truth bodies in `connection-adapters/*/quoting.ts`. The residual
crutch is a handful of adapter-internal modules that import the dialect's
**freestanding** quoting function instead of calling `this.quote*`, so a future
sub-adapter (e.g. a MariaDB/MySQL split) couldn't override them polymorphically.

This is the smallest, fully-isolated instance of that crutch:

- `packages/activerecord/src/connection-adapters/postgresql/referential-integrity.ts:15,19`
  — `disableReferentialIntegritySql` / `enableReferentialIntegritySql` call the
  freestanding `quoteTableName(t)` imported from `./quoting.js` rather than
  dispatching through the adapter.

These are pure module functions taking `string[]`, so converting to instance
dispatch means either making them `this`-typed (per the CLAUDE.md mixin pattern)
or accepting the adapter/quoter as a parameter and calling `this.quoteTableName`
/ `adapter.quoteTableName`. Pick whichever matches how the callers in
`postgresql-adapter.ts` invoke them (`disableReferentialIntegrity`).

Scope is intentionally just this one module (~80 LOC incl. tests). The sibling
crutch sites (MySQL `schema-statements`/`schema-creation`/`schema-definitions`,
SQLite `schema-statements`) are separate stories; do NOT bundle them here. The
`ABSTRACT_QUOTER` fallback in `sanitization.ts`, `base.ts#quoteSqlValue`, and
arel's `quoteArrayLiteral` are explicitly out of scope (separate concerns).

Not RFC 0019: this is adapter convergence, not test-schema canonicalization.

## Acceptance criteria

- [ ] `disable/enableReferentialIntegritySql` no longer import the freestanding
      `quoteTableName`; quoting is dispatched through the adapter instance
      (`this.quoteTableName` / passed-in adapter), per the CLAUDE.md `this`-typed
      mixin pattern
- [ ] No behavior change: emitted SQL is byte-identical for the PG adapter
- [ ] PG referential-integrity tests pass (run only the touched files locally)
- [ ] `api:compare` delta non-negative
