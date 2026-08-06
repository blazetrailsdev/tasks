---
title: "converge-time-with-zone-strftime-onto-date-package"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["move-date-time-to-date-package"]
deps-rfc: []
est-loc: 300
pr: 6147
claim: "2026-08-06T00:53:04Z"
assignee: "converge-time-with-zone-strftime-onto-date-package"
blocked-by: null
closed-reason: null
---

## Context

**Trails has two independent `strftime` implementations.** In Rails there is one.

- `packages/date/src/date.ts:102` `strftime(subject, format)` — the ported
  `date` gem implementation, with the full directive table.
- `packages/activesupport/src/time-with-zone.ts:397` `strftime(format)` — a
  _second_, hand-rolled token table (`Y`, `e`, `j`, `k`, … at
  `time-with-zone.ts:400-420`) with its own padding helpers
  (`time-with-zone.ts:77,81,370-386`).

In Rails, `ActiveSupport::TimeWithZone` does not implement `strftime` at all —
`time_with_zone.rb` delegates to the underlying `Time` (`utc.strftime`), which is
the `date` gem's. Trails' duplicate is exactly the kind of divergence RFC 0088
exists to end: two implementations of one Ruby method, neither measured against
the other, drifting independently.

`packages/activesupport/src/values/time-zone.ts` and
`packages/activerecord/src/migration.ts` also reference `strftime`; check whether
they route through either implementation or hand-roll a third.

This is the clearest instance of "date functions should flow through the date
package as they do in Rails."

## Acceptance criteria

- [ ] `TimeWithZone#strftime` delegates to `packages/date`'s `strftime` rather
      than carrying its own token table — matching Rails' delegation to the
      underlying `Time`.
- [ ] The duplicate token table and any now-unused padding helpers
      (`time-with-zone.ts:77,81`) are **deleted**, not left dead.
- [ ] Directive coverage does not regress: diff the two tables first and port any
      directive the AS one handles that the gem one does not, rather than
      silently dropping it. Record the diff in the PR body.
- [ ] `values/time-zone.ts` and `activerecord/src/migration.ts` audited; any
      third implementation converged or explicitly justified at the call site.
- [ ] `%Z` still answers the zone abbreviation and `%z` the offset, including
      sub-minute offsets — `time.ts:26-28` keeps the offset as a number precisely
      because Temporal offset zones are minute-precision.
- [ ] Existing `time-with-zone` tests pass **unmodified**. If a test fails, the
      implementation is what changes — never the test name.
