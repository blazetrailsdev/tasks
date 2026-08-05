---
title: "converge-quote-identifier-into-quote-column-name"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 5893
claim: "2026-08-02T16:06:00Z"
assignee: "converge-quote-identifier-into-quote-column-name"
blocked-by: null
closed-reason: null
---

## Context

Convergence, not classification. #5345 allowlisted `quoteIdentifier` on four
files with a written reason; the reason was **wrong on the fidelity question**
and this story removes the method instead.

Rails has no `quote_identifier` anywhere. Its generic identifier quoter is
`quote_column_name` — `quote_table_name` literally delegates to it
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:66-67`),
so Rails quotes tables, columns and schema identifiers through that one method.

The decisive finding: on **every concrete adapter `quoteIdentifier` is already a
byte-for-byte synonym of `quoteColumnName`**, so this is a provably behaviour-
preserving rename, not a semantic change.

- `connection-adapters/mysql/quoting.ts:70` — `quoteIdentifier(name) { return quoteColumnName(name); }`.
  A literal alias.
- `connection-adapters/postgresql/quoting.ts` — `quoteColumnName` is
  `` `"${name.replace(/"/g, '""')}"` ``; PostgreSQLAdapter declares no
  `quoteIdentifier` override, so it inherits the abstract ANSI one. Identical output.
- `connection-adapters/sqlite3/quoting.ts:61` — same ANSI body. Identical output.
- `connection-adapters/abstract-adapter.ts:834` — `quoteIdentifier` returns the
  ANSI fallback while `quoteColumnName` (:845) delegates to
  `abstract/quoting.ts` `quoteColumnName`, which **raises NotImplementedError**,
  mirroring Rails (`abstract/quoting.rb:61`).

That last bullet is the one real behaviour difference and the only risk: the
abstract base currently hands out a working ANSI default where Rails raises. Any
call site reaching `quoteIdentifier` on a bare `AbstractAdapter` (no concrete
adapter) will begin throwing after the rename.

**Decision (owner, 2026-07-30): full converge — adopt the raise, in ONE PR.**
The abstract base raises `NotImplementedError` as `abstract/quoting.rb:61` does.
Every bare-adapter call site is found and fixed rather than papered over; audit
test doubles first, since they are the likeliest holders of a bare
`AbstractAdapter`. Do not soften this by leaving the ANSI default in place, and
do not split the rename from the raise — the split was considered and rejected,
because a rename that preserves the wrong behaviour just relocates the bug.

Explicitly NOT in scope: the standalone `@internal` file function
`quoteIdentifier` in `connection-adapters/abstract/quoting.ts:75`. It is the
SQL-92 fallback used only by `ABSTRACT_SCHEMA_QUOTER` when DDL is rendered
without a live adapter, is already `@internal`, and is a defensible separate
thing. Leave it; only the adapter _methods_ go.

Scale: 115 `.quoteIdentifier(` call sites across `packages/*/src`. This is the
**single mechanical rename** case CLAUDE.md exempts from the 500-LOC ceiling —
say so in the PR body. Do not bundle anything else into it.

Sequencing: #5345 touches all four of these files, so this must start from
`main` **after** #5345 merges. Do not stack.

## Acceptance criteria

- `quoteIdentifier` is gone from `AbstractAdapter`, `AbstractMysqlAdapter`,
  `mysql/quoting.ts` and any other adapter surface; all 115 call sites route to
  `quoteColumnName`.
- The `@internal` file function in `abstract/quoting.ts` is untouched.
- The four `quoteIdentifier` names carry no `@noRailsEquivalent` tag
  (`scripts/api-compare/extra-surface.ts:44-47`) — they are converged, not tagged.
- Any site that relied on the abstract ANSI default is identified and fixed
  deliberately; note each in the PR body.
- `pnpm typecheck`, `pnpm lint` clean; scoped `vitest run` on the touched
  adapter/quoting tests passes. MySQL/PG suites need a server; if unavailable
  locally, say so and let CI verify.
