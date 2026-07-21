---
title: "Arel visitor quotes Temporal for real where Rails aliases visit_Time/Date to unsupported"
status: in-progress
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5026
claim: "2026-07-21T11:30:18Z"
assignee: "arel-visitor-quotes-temporal-where-rails-raises"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5021 (arel-nodeorvalue-excludes-temporal-admits-date).

Rails' `ToSql` aliases the temporal visitors to `unsupported`:
`visit_Date` (to_sql.rb:836), `visit_DateTime` (:837), `visit_Time` (:844).
Raw temporal values are not meant to reach the visitor at all — they arrive
wrapped in `Casted` / `BindParam`, quoted by the connection.

trails deviates: `TEMPORAL_CLASS_NAMES`
(packages/arel/src/temporal-tag.ts:36-42) is a 5-entry whitelist that the
visitor visits and quotes for real. #5021 made the `NodeOrValue` type surface
agree with that behavior, but did not change the behavior itself.

The deviation is pre-existing and deliberate (established by #5002 / #5020),
but it is not tracked anywhere as a deviation. This story is to decide
whether it converges — i.e. whether raw Temporal in a node slot should raise
like Rails, with callers wrapping in `Casted`/`BindParam` instead.

Related: arel-duplicates-adapter-datetime-formatters (blocked),
arel-connection-lacks-quoted-date-time-self-dispatch (done).

## Acceptance criteria

- [ ] Determine, with Rails citations, whether any real Rails path reaches
      `visit_Time`/`visit_Date`/`visit_DateTime` without a `Casted`/`BindParam`
      wrapper.
- [ ] If none: converge — alias the temporal visitors to `unsupported`, drop
      the whitelist, and fix callers to wrap. Revert the `NodeOrValue` Temporal
      arms added in #5021.
- [ ] If some path does: document it at the call site as a justified
      deviation and close.
- [ ] api:compare / test:compare delta non-negative.
