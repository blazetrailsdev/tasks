---
title: "Share one strftime between Date and TimeWithZone"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Internal DRY refactor, not a Rails-behavior divergence (both strftimes produce correct output); and RFC 0088 (date-gem-port, active) is porting Date/DateTime wholesale, which subsumes the duplicated token tables."
---

# Share one strftime between Date and TimeWithZone

## Context

activesupport now carries two hand-rolled `strftime` token tables:

- `packages/activesupport/src/time-with-zone.ts:397-443` — reads a
  `Temporal.PlainDateTime`, covers `%Y %C %y %m %d %e %j %H %k %I %l %P %p %M
%S %L %N %z %Z %:z %A %a %u %w %B %b %h %s %n %t %%`.
- `packages/activesupport/src/date.ts` (added by PR #6035) — reads a
  `Temporal.PlainDate`, covers the date-only subset `%Y %y %m %d %e %j %F %A
%a %B %b %h %%`.

The month- and day-name constants (`DAY_NAMES`, `ABBR_DAY_NAMES`,
`MONTH_NAMES`, `ABBR_MONTH_NAMES`) are duplicated between them, as is the
`%-` no-padding flag handling.

In Ruby this duplication does not exist: `Date#strftime` and `Time#strftime`
are both `Date::Format`/`strftime(3)` implementations over the same directive
set, and a `Date` simply has no time-of-day fields to format.

## Converged shape

One directive table, with the time-only directives resolving against fields a
`Date` does not have. Both classes keep their own `strftime` method — that is
what Ruby has — and share the implementation underneath.

Deliberately deferred once already: the split was left in place when
`date.ts` landed, to keep PR #6035 scoped to the test-double convergence and
avoid refactoring `time-with-zone.ts` in the same diff.

## Acceptance criteria

- `DAY_NAMES` / `ABBR_DAY_NAMES` / `MONTH_NAMES` / `ABBR_MONTH_NAMES` and the
  `%-` flag handling exist once, not twice.
- `Date#strftime` and `TimeWithZone#strftime` both survive as methods with
  their current signatures; no call site changes.
- Existing coverage passes unchanged —
  `packages/activesupport/src/time-with-zone.test.ts`,
  `packages/activesupport/src/date.trails.test.ts`, and the localization cases
  in `packages/activesupport/src/i18n.test.ts`.
