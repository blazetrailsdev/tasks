---
title: "MySQL schema modules: dispatch quoting through the adapter instance"
status: claimed
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 150
priority: 3
pr: null
claim: "2026-06-11T18:54:05Z"
assignee: "mysql-schema-modules-quote-dispatch"
blocked-by: null
---

## Context

From the `drop-legacy-crutches` audit (Q2). Sibling of
`pg-referential-integrity-quote-dispatch`. Several MySQL adapter-internal modules
import the dialect's **freestanding** quoting functions from `./quoting.js`
instead of dispatching through `this.quote*`, so a future sub-adapter (e.g. a
MariaDB/MySQL split, mirroring the existing Mysql2/Trilogy shape) can't override
them polymorphically. trails already exposes the MySQL quoting helpers as real
instance methods on `AbstractMysqlAdapter` (`abstract-mysql-adapter.ts:308,318,
364,933,937,1196`), backed by the single-source-of-truth bodies in
`connection-adapters/mysql/quoting.ts`.

Freestanding call sites to converge:

- `connection-adapters/mysql/schema-statements.ts:302,304,305` — `quoteString(...)`
  building an introspection scope.
- `connection-adapters/mysql/schema-creation.ts` — imports `quoteIdentifier`,
  `quoteTableName`, `quoteString as mysqlQuoteString`.
- `connection-adapters/mysql/schema-definitions.ts:21` — imports `quoteIdentifier`,
  `quoteTableName`.

Convert each to instance dispatch per the CLAUDE.md `this`-typed mixin pattern
(make the module function `this`-typed, or thread the adapter/quoter and call
`this.quoteX` / `adapter.quoteX`). Match how the callers in
`abstract-mysql-adapter.ts` invoke these modules.

Out of scope: PG referential-integrity (separate story), SQLite schema-statements
(separate story), the `sanitization.ts` `ABSTRACT_QUOTER` fallback,
`base.ts#quoteSqlValue`, arel `quoteArrayLiteral`. Not RFC 0019 — this is adapter
convergence, not test-schema canonicalization.

## Acceptance criteria

- [ ] MySQL `schema-statements` / `schema-creation` / `schema-definitions` no
      longer import freestanding `quote*`; quoting dispatches through the adapter
      instance per the CLAUDE.md `this`-typed mixin pattern
- [ ] No behavior change: emitted SQL is byte-identical for the MySQL adapter
- [ ] Touched MySQL schema tests pass (run only the touched files locally)
- [ ] `api:compare` delta non-negative
