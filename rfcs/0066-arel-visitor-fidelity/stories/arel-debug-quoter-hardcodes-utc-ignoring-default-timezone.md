---
title: "arel debug quoter hardcodes UTC, ignoring default_timezone"
status: ready
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
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

`packages/arel/src/visitors/default-quoter.ts` `quotedDate` (added in #5020)
hardcodes UTC for `Temporal.Instant` and `Temporal.ZonedDateTime`:

```ts
if (value instanceof Temporal.Instant) return formatPlainDateTime(value.toZonedDateTimeISO("UTC"));
```

Rails' `quoted_date` (`abstract/quoting.rb:184-192`) branches on
`default_timezone`: `value.getutc` when `:utc`, `value.getlocal` otherwise.
The adapter twin ports this faithfully via `defaultSqlTimezone()`
(`connection-adapters/abstract/sql-datetime.ts:23-25`).

The arel copy cannot reach that setting: `getDefaultTimezone()` lives in
`packages/activerecord/src/type/internal/timezone.ts`, and `arel` must not
depend on `activerecord`. So the UTC hardcode is a real deviation, currently
justified only by unreachability — this host serves the connection-less
`Node#toSql()` debug path, and every adapter construction site passes a real
connection whose own `quoted_date` owns the timezone branch.

Filed separately from `arel-duplicates-adapter-datetime-formatters` because
that story's acceptance criteria assume the timezone layer _stays_ in
activerecord; per the "deviations always converge" rule that assumption is
itself worth challenging rather than baking in.

## Acceptance criteria

- [ ] Determine whether `default_timezone` (or a narrower "SQL serialization
      zone" reader) can live somewhere both `arel` and `activerecord` reach —
      `activesupport` is the candidate, since `arel` already imports `Temporal`
      from it.
- [ ] Either the arel `quotedDate` honours `default_timezone` like
      `abstract/quoting.rb:184-192`, or the UTC hardcode is recorded at the
      call site as permanent with the dependency-direction justification.
- [ ] No behaviour change on the real adapter path.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Low urgency: unreachable from any adapter path. Interacts with
`arel-duplicates-adapter-datetime-formatters` — if the formatters hoist, this
decision should be made in the same pass.
