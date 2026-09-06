---
title: "DAYS_INTO_WEEK is Symbol-keyed in Rails, so its KeyError message keeps the colon"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DateAndTime::Calculations`'s `DAYS_INTO_WEEK`
(`activesupport/lib/active_support/core_ext/date_and_time/calculations.rb:8-16`)
is a **Symbol-keyed** Hash in Rails — `{ sunday: 0, monday: 1, ... }` — and
every reader fetches it with a Symbol: `DAYS_INTO_WEEK.fetch(start_day)`
(`:212`, `:246`, `:257`, `:279`). Ruby's `Hash#fetch` composes its `KeyError`
message from `rb_inspect(key)` (`vendor/ruby/hash.c:2196-2202`), so an unknown
day raises `key not found: :sundy`, colon and all.

trails spells the constant with plain String keys
(`packages/activesupport/src/core-ext/date-and-time/calculations.ts:37-45`),
which is a Symbol-value deviation: CLAUDE.md's settled convention is that a
Ruby Symbol is a JS string that KEEPS its leading colon (`":sunday"`).

RFC 0129's `ruby-compat-hash-fetch-and-key-error` (PR #7266) deleted the
private raising `fetch` at `:201` and routed the four call sites through
`@blazetrails/ruby-compat`'s shared `fetch`, whose `inspectKey` renders a
Symbol key with its colon and a String key quoted. Because the trails constant
is String-keyed, the message moved from `key not found: :sunday` to
`key not found: "sunday"` — correct for the key it is actually given, wrong for
the key Rails gives it. No test pinned either spelling.

## Acceptance criteria

- `DAYS_INTO_WEEK`'s keys are Ruby Symbols under trails' convention
  (`":sunday"` … `":saturday"`), matching `calculations.rb:8-16`.
- The four `fetch(DAYS_INTO_WEEK, …)` call sites and every other reader pass a
  Symbol, so an unknown day raises `key not found: :sundy` exactly as MRI does.
- `WEEKEND_DAYS` (`calculations.rb:17`) is checked for the same treatment — it
  holds `wday` integers in Rails, so it likely needs none; state the finding
  either way.
- Public callers that pass a bare `"sunday"` (`beginningOfWeek`, `nextWeekday`,
  `weekField` and the `Date`/`Time` arms) keep working, or are converged in the
  same pass with the Symbol spelling; the activesupport suite stays green.
- `pnpm parity:api:calls:args` shows no new rows.
