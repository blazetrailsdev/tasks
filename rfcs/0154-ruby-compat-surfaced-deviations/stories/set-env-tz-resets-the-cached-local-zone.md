---
title: 'ruby-compat: setEnv("TZ") resets the cached local zone, as reset_by_modified_env does'
status: done
updated: 2026-10-14
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8880
claim: "2026-10-13T23:42:24Z"
assignee: "batches-and-calculations-carry-rails-private-sections"
blocked-by: null
closed-reason: null
---

## Context

MRI resets its cached time zone whenever `ENV["TZ"]` is assigned or deleted:
`env_aset` and `env_delete` call `reset_by_modified_env`
(`vendor/ruby/v3.3.11/hash.c:4961-4978`), which calls `ruby_reset_timezone`.
So `with_env_tz`
(`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:207-212`) only
assigns `ENV["TZ"]`.

ruby-compat's `setEnv` (`packages/ruby-compat/src/process-adapter.ts`) writes
the variable and nothing else, and `@blazetrails/date` caches the local zone id
(`resetLocalTimeZoneId`, `packages/date/src/time.ts`). `@blazetrails/date`
depends on ruby-compat, so `setEnv` cannot call it. `ActiveRecord::TestCase#withEnvTz`
(`packages/activerecord/src/cases/test-case.ts`) therefore calls
`resetLocalTimeZoneId()` after each `setEnv("TZ", ...)`, a call Rails' body
does not make. The file is outside the arms gate's compared set, so the
call carries no receipt.

## Acceptance criteria

- [ ] Assigning or deleting `TZ` through `setEnv` resets the cached local zone,
      as `reset_by_modified_env` does.
- [ ] `withEnvTz` is `setEnv` and the block only.
