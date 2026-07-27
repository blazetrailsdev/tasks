---
title: "relocate-ar-default-timezone-to-ar-config"
status: ready
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the `audit-setx-functions-without-rails-counterpart` audit.

`packages/activerecord/src/type/internal/timezone.ts:25` exports
`setDefaultTimezone`, which is a faithful port of
`ActiveRecord.default_timezone=` (`vendor/rails/activerecord/lib/active_record.rb:218`),
including its `ArgumentError` message. But
`vendor/rails/activerecord/lib/active_record/type/internal/timezone.rb` carries
readers only (`is_utc?`, `default_timezone`) — no writer. The port therefore
lives outside its Rails-layout file, which is why `api:compare` never matched
it to a Ruby counterpart under either spelling.

The rest of the `active_record.rb` module attributes live in
`packages/activerecord/src/ar-config.ts`, so that is where the writer and its
backing binding belong. Callers today:
`connection-handling.ts:865`, `test-helper.ts:43,52`.

Note `type/internal/timezone.ts` also forwards into activemodel's parallel
setting (`setActiveModelTimezone`); preserve that lockstep or fold it into the
new home.

## Acceptance criteria

- `defaultTimezone` / `setDefaultTimezone` (and `getDefaultTimezone`) move to
  `ar-config.ts` alongside the other `active_record.rb` module attributes; the
  validation and `ArgumentError` message are unchanged.
- `type/internal/timezone.ts` keeps only the Rails-shaped readers (`isUtc`,
  `Timezone#defaultTimezone`), reading the value from its new home.
- Existing callers updated; timezone tests pass with names unchanged.
- `pnpm api:compare` matches `ActiveRecord.default_timezone=`; `pnpm api:extra`
  shows no new or stale entries.
