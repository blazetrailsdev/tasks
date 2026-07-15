---
title: "Dialect quoteString returns a full literal instead of Rails' escape-only quote_string"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting the abstract `quote` branch order (#4875). That PR's
description claimed the dialect `quote` overrides "legitimately front-load"
their own branches. Re-reading Rails shows that is only partly true: the
String/Symbol arms have no Rails counterpart, and there is a single root cause.

**Rails' `quote_string` is escape-only, in every layer:**

- abstract `quote_string` — `activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:131-133`:
  `s.gsub("\\", '\&\&').gsub("'", "''")` — escapes, does NOT add surrounding quotes.
- PostgreSQL `quote_string` — `.../postgresql/quoting.rb:127-131`: `connection.escape(s)`
  — also escape-only. There is NO `E'`-prefix handling anywhere in Rails'
  postgresql/quoting.rb.

The surrounding quotes are added by the _caller_, once, in abstract `quote`
(`abstract/quoting.rb:75-76` — `"'#{quote_string(value.to_s)}'"`).

**trails' dialect `quoteString` instead returns a complete literal:**

- `packages/activerecord/src/connection-adapters/postgresql/quoting.ts:100` —
  returns `E'...'` when the value contains a backslash, else `'...'`. Quotes
  included.
- abstract `quoteString` (`.../abstract/quoting.ts`) is escape-only and correct,
  so the two layers disagree on what `quoteString` returns.

Because PG's `quoteString` already yields a finished literal, PG's `quote` must
intercept strings before delegating to the abstract `quote` (which would wrap a
second time, producing `''...''`). Hence the String arm.

**Consequence — dialect `quote` bodies carry arms Rails does not have.**
Rails' PG `quote` (`.../postgresql/quoting.rb`) cases only `OID::Xml::Data`,
`OID::Bit::Data`, `Numeric` (finite -> `super`), `OID::Array::Data`, `Range`,
else `super` — no String, no Symbol. Rails' SQLite `quote`
(`.../sqlite3/quoting.rb`) cases only `Numeric`, else `super` — no String, no
Symbol, no boolean. trails' `postgresql/quoting.ts` and `sqlite3/quoting.ts`
both intercept string and symbol, and sqlite3 additionally carries a boolean arm
that Rails leaves to the abstract `when true/false` (rb:77-78).

Note the binary-arm duplication in these same files is already tracked by
`abstract-quote-binary-data-self-dispatch` (in-progress) — this story is
scoped to the `quoteString` semantics and the String/Symbol/boolean arms, and
should land after it to avoid file conflicts.

## Acceptance criteria

- [ ] Dialect `quoteString` matches Rails' `quote_string` contract: escape-only,
      no surrounding quotes, for PG (and MySQL/SQLite if they diverge the same
      way).
- [ ] PG's `E'`-prefix literal construction moves to wherever Rails actually
      performs it, or is justified in a comment with a Rails anchor if PG's
      escape genuinely requires it at literal-construction time.
- [ ] All `quoteString` callers updated for the changed return contract (it is
      called from schema/DDL paths as well as `quote`, so audit them all).
- [ ] PG and SQLite `quote` drop the String/Symbol arms and fall through to the
      abstract `quote`; sqlite3 drops the boolean arm (abstract rb:77-78 covers it).
- [ ] Behavior unchanged: literals still render identically, including the
      backslash/`E''` cases PG's current branch handles. Adapter tests for PG,
      MySQL, and SQLite all green.
- [ ] api:compare / test:compare delta non-negative.
