---
title: "sanitizeSqlArray: thread the adapter quoter, drop the ABSTRACT_QUOTER fallback"
status: claimed
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 180
priority: 4
pr: null
claim: "2026-06-11T19:39:05Z"
assignee: "sanitize-sql-array-adapter-threading"
blocked-by: null
---

## Context

From the `drop-legacy-crutches` audit (Q4). `sanitization.ts:29–35` defines
`ABSTRACT_QUOTER`, an object literal wrapping the abstract **freestanding**
quoting fns (`abstractQuote` / `abstractQuoteIdentifier` /
`abstractQuoteTableNameForAssignment` / `abstractQuoteString` /
`abstractCastBoundValue`). The public `sanitizeSqlArray(...)` entrypoint
(`sanitization.ts:46`) uses it as a fallback — documented in-code as "fallback
for callers that haven't been migrated to thread an adapter." Because it pins the
**abstract** dialect, `sanitizeSqlArray` quotes with SQL-92 rules regardless of
the live adapter (e.g. `%s` format-string substitution calls
`quoter.quoteString`). The internal `_sanitizeSqlArray(quoter, ...)` already
takes a `Quoter`, so the plumbing is in place — only the public entrypoint hard-codes
`ABSTRACT_QUOTER`.

Callers (all reach it via the static `Base.sanitizeSqlArray`, declared
`base.ts:605`):

- `relation/query-methods.ts:465, 538, 803, 1078` — all `this._modelClass.sanitizeSqlArray(...)`.

The model class has a `connection` (the live adapter), so the static can resolve
the real adapter's quoter (`this.connection`) and thread it into
`_sanitizeSqlArray` instead of `ABSTRACT_QUOTER`. Verify the static/instance
entrypoint shape (`Base.sanitizeSqlArray` is a delegated `Sanitization.ClassMethods`
method) and confirm there's always a resolvable connection at call time; if any
caller can run before a connection is established, keep a guarded fallback rather
than reintroducing the unconditional abstract one.

Larger and riskier than the per-adapter Q1–Q3 stories because it changes the
dialect used for sanitized SQL on PG/MySQL (double-quote/backtick, dialect string
escapes) — there may be tests asserting abstract-style quoting that need
updating to the live dialect. If the change exceeds ~500 LOC once test fixups are
counted, split: (a) thread the quoter + keep behavior on SQLite-default;
(b) follow-up dialect-fixups per adapter. **Verify caller/test count before
claiming.**

Out of scope: the per-adapter schema-module stories, `base.ts#quoteSqlValue`,
arel `quoteArrayLiteral`. Not RFC 0019.

## Acceptance criteria

- [ ] `sanitizeSqlArray` quotes through the live adapter's quoter, not a
      hard-coded abstract one; `ABSTRACT_QUOTER` removed (or reduced to a guarded
      no-connection fallback with a documented reason)
- [ ] Sanitized SQL uses the live dialect's quoting on PG/MySQL/SQLite
- [ ] Affected sanitization/query-method tests pass on all three adapters (run
      only the touched files locally)
- [ ] `api:compare` delta non-negative
