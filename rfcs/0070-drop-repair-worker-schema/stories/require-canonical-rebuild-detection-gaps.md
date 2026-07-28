---
title: "Close or accept require-canonical-rebuild's four sweep-detection gaps"
status: ready
updated: 2026-07-28
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`require-canonical-rebuild` (`eslint/require-canonical-rebuild.mjs`, landed in
PR #5519) catches a canonical table dropped by a catalogue-driven sweep — the
shape that silently removed `items` from the shared per-worker PostgreSQL
database and made `fixtureRegistry seeds against TEST_SCHEMA` fail
intermittently on a PG shard.

Detection is syntactic, and four shapes let a **real** sweep through
undetected. All are recorded in the rule's `meta.docs.description`; this story
is the tracking anchor so they are not inherited as unexamined blind spots:

1. A filter list built from values that are neither string literals nor
   array-literal elements — a map lookup, a function return, or a name read off
   another query's rows.
2. A catalogue spelled outside the `CATALOGUE_SOURCE` alternation. The
   alternation currently covers `pg_tables`, `pg_class`, `sqlite_master`,
   `sqlite_schema`, `pragma_table_list`, `information_schema.tables` and
   `SHOW TABLES`. `pragma_table_list` was missing until review round 2 caught
   it, which would have left the whole SQLite lane blind — evidence that this
   list rots silently.
3. A swept name reaching either drop spelling through a call the rule cannot
   see through, such as `dropTable(String(t))` or any wrapper function. Member,
   optional-chain, non-null, logical and single-expression-template wrappings
   ARE unwrapped; a call is not.
4. A catalogue query built by string concatenation or returned from a helper.
   Only a literal, a template, or an identifier holding one is followed to a
   sink.
5. The assignment form of a for-of head — `for (t of tables)` with `t` declared
   elsewhere — whose loop head is a bare `Identifier` rather than a declaration
   and so matches no binding test. Never detected, in any revision of the rule;
   surfaced in review once the predicate was rewritten as an explicit binding
   test rather than an upward walk.

Each is a place where the guard reports nothing while the drift still happens,
so a future sweep written in one of these spellings would reproduce the
original `items` incident with no lint signal.

## Acceptance criteria

- Decide per gap: close it, or record it as permanently accepted with the
  reason. A gap that stays open needs a written justification, not silence.
- Gap 2 is the highest value and the cheapest: add a check (test or lint) that
  fails when a catalogue identifier used in `packages/**` is absent from
  `CATALOGUE_SOURCE`, so the alternation cannot rot again. Derive the candidate
  set by grepping the adapters for catalogue reads.
- Gap 3: unwrapping a call argument is plausible for the single-argument
  identity-ish case (`String(t)`, `sqliteQuoteStringLiteral(t)`); measure the
  false-positive cost repo-wide before adopting.
- Any change must keep repo-wide reports at 0 and keep the PR #5519 regression
  case reporting: the pre-fix `postgresql-adapter.trails.test.ts` sweep naming
  `items`.
