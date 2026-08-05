---
title: "datetime-new-start-preserves-the-receiver"
status: blocked
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-05T12:15:04Z"
assignee: "datetime-new-start-preserves-the-receiver"
blocked-by: "Blocked on unmerged PR #6123, which is what lands Date#new_start/italy/england/julian/gregorian and Date's start/jd state in packages/i18n/src/date.ts. main has no newStart to converge; DateTime cannot take a start argument before that PR merges. Re-ready once #6123 is merged."
closed-reason: null
---

## Context

`Date#new_start` and its four aliases landed in PR #6123
(`packages/i18n/src/date.ts`, `newStart` / `italy` / `england` / `julian` /
`gregorian`). They answer `Date.jd(this.#jd, start)`.

ruby/date's `dup_obj_with_new_start` (`date_core.c:5802-5812`) dups the
_receiver_, so `DateTime#new_start` answers a `DateTime` that keeps its
hour/min/sec. The port answers a plain `Date`, dropping both the class and the
time of day.

The blocker is that `DateTime` (`date.ts`) carries no `start` of its own: its
constructor is `(year, month, day, hour, minute, second)`, where ruby/date's is
`DateTime.new(y, m, d, h, min, s, offset, start)` (`date_core.c`
`datetime_s_new`). Converging `new_start` means giving `DateTime` the `start`
argument first, so a dup can carry it.

Nothing calls `newStart` on a `DateTime` today, which is why #6123 shipped the
`Date` arm alone rather than half-porting `DateTime`.

## Acceptance criteria

- [ ] `DateTime`'s constructor takes `start`, as `datetime_s_new` does.
- [ ] `DateTime#new_start` / `#italy` / `#england` / `#julian` / `#gregorian`
      answer a `DateTime` with the same hour/min/sec and the new start,
      agreeing with `ruby 3.3.11 -rdate`.
