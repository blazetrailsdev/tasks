---
title: "type_cast inlines date/time formatting instead of dispatching through quoted_date/quoted_time"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' abstract `type_cast` dispatches date/time values through `self`:
`when Type::Time::Value then quoted_time(value)` and
`when Date, Time then quoted_date(value)` (abstract/quoting.rb:93-101). This is
the same self-dispatch that PR #3222 fixed for `quote` — so an adapter override
of `quoted_date` / `quoted_time` (e.g. PostgreSQL's BC-suffixing `quotedDate`)
flows into `type_cast` too.

Our port's `typeCast` (`connection-adapters/abstract/quoting.ts`) instead
inlines the formatters (`formatInstantForSql`, `formatPlainDateForSql`, …)
directly, bypassing the dispatch chain. The per-adapter `typeCast`
reimplementations have the same gap. Output is currently faithful (no adapter
overrides `quoted_date` in a way that affects `type_cast`'s year range), but the
structural deviation is real and mirrors the `quote` issue PR #3222 resolved.

## Acceptance criteria

- Abstract `typeCast` threads `this` and dispatches Date/Time through the same
  `dispatchQuotedDate` / `dispatchQuotedTime` helpers `quote` uses, falling back
  to the module-level helpers when called bare.
- `AbstractAdapter#typeCast` / adapter overrides call the standalone via
  `.call(this, value)` so the dispatch resolves to adapter overrides (matches
  the `quote` wiring from PR #3222).
- Output is unchanged for every existing case — verified against the current
  quoting tests.
- Add a test proving `typeCast` of a Date/Time dispatches through a host
  `quotedDate` / `quotedTime` override.
- No `node:*` imports, no `process.*`, async fs only, no new runtime deps.
- Test names match Rails verbatim where a Rails counterpart exists.
