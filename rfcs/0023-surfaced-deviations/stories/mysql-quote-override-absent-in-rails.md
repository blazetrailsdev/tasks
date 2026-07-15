---
title: "Rails' MySQL adapter has no quote override; trails invents one"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting the abstract `quote` branch order (#4875).

**Rails' MySQL adapter has no `quote` override at all.** Grepping
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/quoting.rb`
and `.../abstract_mysql_adapter.rb` for `def quote(` returns nothing — MySQL
inherits abstract `quote` (`abstract/quoting.rb:73-88`) wholesale. Compare PG
and SQLite, which _do_ override and are anchored at
`.../postgresql/quoting.rb` and `.../sqlite3/quoting.rb`.

trails invents one at `packages/activerecord/src/connection-adapters/mysql/quoting.ts`
(the `quote` export, ~L191-196 and above). Its arms:

- non-finite numbers -> `quoteString(String(value))`. The in-file comment
  justifies this on its own terms (`String(Infinity)` is the bareword
  `Infinity`, which MySQL parses as an identifier), but cites no Rails anchor —
  because there is none. Rails' MySQL sends `Float::INFINITY` through abstract
  `when Numeric then value.to_s` (rb:82) with no special-casing.
- `Buffer`/`Uint8Array`/`BinaryData` -> `quotedBinary`. Tracked separately by
  `abstract-quote-binary-data-self-dispatch` (in-progress).
- symbol / string -> `quoteString(...)`. Tracked by
  `dialect-quotestring-returns-literal-not-escape-only`.

Once those two stories land, the only arm left with no Rails counterpart is the
non-finite-number one, and the override itself should disappear so MySQL
inherits abstract `quote` like Rails.

The non-finite arm is the one real behavioral question: it may be papering over
a genuine gap (Rails may simply never reach `quote` with a non-finite float
because the Float type casts first), or it may be a real trails-only guard. That
needs deciding against Rails rather than being carried by default — hence a
story rather than a silent deletion.

## Acceptance criteria

- [ ] Determine whether Rails' MySQL can reach `quote` with a non-finite Float,
      and what it renders if so. Record the finding with a Rails anchor.
- [ ] If Rails has no such guard, delete the MySQL `quote` override entirely so
      MySQL inherits abstract `quote`, matching Rails' file layout (no `def quote`
      in mysql/quoting.rb).
- [ ] If the guard is genuinely required for trails, keep the minimum arm and
      document it with the Rails anchor explaining why trails must diverge.
- [ ] MySQL and MariaDB adapter tests green (CI gates these via ARCONN).
- [ ] Depends on `abstract-quote-binary-data-self-dispatch` and
      `dialect-quotestring-returns-literal-not-escape-only`; land after both to
      avoid conflicts in mysql/quoting.ts.
- [ ] api:compare / test:compare delta non-negative.
