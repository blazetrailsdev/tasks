---
title: "SQLite quote reimplements branches inline instead of super + dispatched quoted_time"
status: claimed
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-15T19:24:26Z"
assignee: "sqlite-quote-dispatch-through-super"
blocked-by: null
---

## Context

`SQLite3::Quoting#quote` in Rails only special-cases `Numeric` and otherwise
calls `super` (the abstract `quote`), so a `Time::Value` dispatches through
`self.quoted_time` — which SQLite overrides to keep a leading `2000-01-01` date
prefix (`'2000-01-01 HH:MM:SS'`, vs the abstract `quoted_time`'s bare
`HH:MM:SS`).

Our port's `sqliteQuote` (`connection-adapters/sqlite3/quoting.ts`) instead
reimplements **every** branch inline (strings, binary, bools, symbols, dates),
emitting the correct literals but bypassing the dispatch chain. The SQLite
adapter also never wires `quotedDate`/`quotedTime` onto the class, so the
abstract `quote`'s `self.quoted_date` / `self.quoted_time` dispatch could not
reach SQLite's overrides even if `quote` delegated.

Output is currently faithful; the divergence is structural. Surfaced while
reviewing PR #3222 (quote/quote_table_name dispatch), which fixed the abstract
layer plus PostgreSQL but deliberately left SQLite as a separate, larger
refactor.

## Acceptance criteria

- `sqliteQuote` follows Rails' structure: special-case `Numeric`
  (finite delegates; non-finite returns the quoted string form) and route the
  remaining cases through the abstract `quote` via `abstractQuote.call(this, value)`
  instead of re-listing every branch inline.
- SQLite's `quotedDate` and `quotedTime` are exposed on the `SQLite3Adapter`
  class so the inherited dispatch lands on them (`quotedTime` keeps the leading
  `2000-01-01` date prefix; `quotedDate` matches the abstract).
- Output is unchanged for every existing case (string, binary, bool, symbol,
  date, time literals) — verified against current `sqlite3/quoting.test.ts`.
- Add a test proving `quote` of a `PlainTime` dispatches through the adapter's
  `quotedTime` (override the host `quotedTime` and observe it in `quote`'s output).
- No `node:*` imports, no `process.*`, async fs only, no new runtime deps.
- Test names match Rails verbatim where a Rails counterpart exists.
