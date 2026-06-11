---
title: "SQLite schema-statements: dispatch quoting through the adapter instance"
status: ready
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

From the `drop-legacy-crutches` audit (Q3). Smallest sibling of
`pg-referential-integrity-quote-dispatch` / `mysql-schema-modules-quote-dispatch`.

- `connection-adapters/sqlite3/schema-statements.ts:99` — imports and calls the
  freestanding `quoteColumnName(schema)` from `./quoting.js` instead of
  dispatching through `this.quoteColumnName`. (It also imports
  `extractValueFromDefault`, which is not a quoting helper — leave that import.)

trails already exposes SQLite quoting as real instance overrides on the SQLite
adapter (`sqlite3-adapter.ts:608–664`), backed by
`connection-adapters/sqlite3/quoting.ts`. Convert the call site to instance
dispatch per the CLAUDE.md `this`-typed mixin pattern.

Out of scope: PG/MySQL sibling stories, the `sanitization.ts` `ABSTRACT_QUOTER`
fallback, `base.ts#quoteSqlValue`, arel `quoteArrayLiteral`. Not RFC 0019.

## Acceptance criteria

- [ ] SQLite `schema-statements.ts` no longer imports the freestanding
      `quoteColumnName`; quoting dispatches through the adapter instance
- [ ] `extractValueFromDefault` import is left intact
- [ ] No behavior change: emitted SQL is byte-identical for the SQLite adapter
- [ ] Touched SQLite schema tests pass (run only the touched files locally)
- [ ] `api:compare` delta non-negative
