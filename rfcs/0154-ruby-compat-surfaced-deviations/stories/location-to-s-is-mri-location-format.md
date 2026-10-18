---
title: "location-to-s-is-mri-location-format"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
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

ruby-compat's `Location#toString` (`packages/ruby-compat/src/backtrace-location.ts`)
returns the raw V8 frame (`at eval (/srv/blog/app/models/post.js:3:12)`). MRI's
`Thread::Backtrace::Location#to_s` is `location_format`
(`vendor/ruby/v3.3.11/vm_backtrace.c:388-401`): ``path:lineno:in `label'``, with
`unknown method` for a nameless frame. `Exception#backtrace` strings are the same
format in Ruby, so `excBacktrace` would change alongside it.

Because of this, `Thread.eachCallerLocation` (trails#9042) cannot yet stand in for
activesupport's `callerLocations()` in `ActiveRecord::LogSubscriber#query_source_location`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/log_subscriber.rb:130`) and
`QueryLogs.query_source_location` (`query_logs.rb:156`). `clean_frame` calls `to_s`
(`activesupport/lib/active_support/backtrace_cleaner.rb:62`), and `Trails.backtraceCleaner`'s
filters expect the MRI form (`packages/trailties/src/trailties/active-record.trails.test.ts`,
"active_record.backtrace_cleaner points the verbose query log at the app frame").

I tried switching `toString` to the MRI format. It reds 10 tests that read V8 lines:
`exception-wrapper.test.ts` (#application_trace, #framework_trace, #traces),
`exception-wrapper.trails.test.ts`, `debug-exceptions.test.ts` ("logs only what is
necessary", "logs exception causes"), `template/error.trails.test.ts` (2) and
`syntax-error-proxy.trails.test.ts` (2).

## Acceptance criteria

- `Location#toString` and `excBacktrace` answer MRI's `location_format`, and every consumer above is converged.
- `ActiveRecord::LogSubscriber` and `QueryLogs` call `Thread.eachCallerLocation`, as Rails does.
