---
title: "AR and ActiveJob source-location readers call Thread.each_caller_location"
status: ready
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps:
  - location-to-s-is-mri-location-format
deps-rfc: []
est-loc: 80
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby 3.2's `Thread.each_caller_location` (`vendor/ruby/v3.3.11/vm_backtrace.c`,
`each_caller_location`) yields the caller's frames one at a time, and a
`break` stops the walk. trails#9042 ported it as `Thread.eachCallerLocation`
(`packages/ruby-compat/src/thread.ts:117`) and converged
`ActionDispatch::Routing::Mapper` onto it
(`packages/actionpack/src/action-dispatch/routing/mapper.ts:908`, Rails
`mapper.rb:381`).

Three hand ports still loop over activesupport's `callerLocations()` where
Rails calls `Thread.each_caller_location`:

- `packages/activejob/src/log-subscriber.ts:274` — `enqueue_source_location`,
  `vendor/rails/v8.0.2/activejob/lib/active_job/log_subscriber.rb:200`
- `packages/activerecord/src/log-subscriber.ts:131` — `query_source_location`,
  `vendor/rails/v8.0.2/activerecord/lib/active_record/log_subscriber.rb:130`
- `packages/activerecord/src/query-logs.ts:125` — `query_source_location`,
  `vendor/rails/v8.0.2/activerecord/lib/active_record/query_logs.rb:156`

They wait on `location-to-s-is-mri-location-format`: each block hands the
location to a backtrace cleaner whose `clean_frame` calls `to_s`
(`activesupport/lib/active_support/backtrace_cleaner.rb:62`), and
`Location#toString` still answers the raw V8 frame.

## Acceptance criteria

- [ ] The three sites call `Thread.eachCallerLocation` with Rails' block body,
      and stop through ruby-compat's block-break idiom where Rails `break`s.
- [ ] Their log-subscriber / query-logs tests (the activejob "verbose enqueue
      logs" case, `active-record.trails.test.ts` "points the verbose query log
      at the app frame") stay green.
- [ ] `pnpm parity:api:calls` stays green; any baseline row the convergence
      makes stale is deleted by hand.
