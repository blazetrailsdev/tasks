---
title: "trailties-test-configuration-time-zone-aware-types-leak"
status: draft
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
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

`packages/trailties/test/application/configuration.test.ts:3518-3567` holds three ports of
`vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb:4543-4583`:
"adds a time zone aware type if using PostgreSQL", "doesn't add a time zone aware type if
using MySQL" and "can opt out of extra time zone aware types if using PostgreSQL".

"doesn't add a time zone aware type if using MySQL" fails intermittently with
`expected [ 'datetime', 'time', 'timestamptz' ] to deeply equal [ 'datetime', 'time' ]`
(CI: trails#10709, run 45461469041, job 138685642176). It reproduces locally with
`pnpm vitest run packages/trailties/test/application/configuration.test.ts -t "time zone aware type"`,
with or without trails#10709's diff, and the result depends on order and timing (main's last run passed).

Cause: Rails runs each test in a fresh process (isolation harness), so
`ActiveRecord::Base.time_zone_aware_types << :timestamptz`
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/railtie.rb:89-95`) never leaks between them.
trails boots all three in one process. `pushTimestamptzToTimeZoneAwareTypes`
(`packages/trailties/lib/trailties/active-record.ts:114-118`) mutates `Base.timeZoneAwareTypes`
in place, and no test restores it. The `includes` guard there is also an arm Rails does not have
(Rails appends unconditionally), which looks like a workaround for this same in-process reuse.

## Acceptance criteria

- [ ] Each of the three tests restores `ActiveRecord.Base.timeZoneAwareTypes` (for example, add it
      to the class-level restore list, or save and restore it in `onTestFinished`), so none depends on
      another's run.
- [ ] The `-t "time zone aware type"` subset passes repeatedly, in any order.
- [ ] Converge or receipt the `includes` guard in `pushTimestamptzToTimeZoneAwareTypes` against `railtie.rb:92`.
