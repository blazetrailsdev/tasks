---
title: "thread-each-caller-location"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby 3.2's `Thread.each_caller_location` (`vendor/ruby/v3.3.11/vm_backtrace.c`,
`each_caller_location`) yields the caller's frames as
`Thread::Backtrace::Location`s one at a time, without building the whole
array, and a `break` in the block stops the walk. ruby-compat has no port.

Rails reaches it at:

- `vendor/rails/v8.0.2/activejob/lib/active_job/log_subscriber.rb:200`
  (`enqueue_source_location`; activejob's "verbose enqueue logs" test needs it)
- `vendor/rails/v8.0.2/activerecord/lib/active_record/log_subscriber.rb`
- `vendor/rails/v8.0.2/activerecord/lib/active_record/query_logs.rb`
- `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`

The three trails hand ports loop over `callerLocations()` instead
(`packages/activerecord/src/log-subscriber.ts:131`,
`packages/activerecord/src/query-logs.ts:125`,
`packages/actionpack/src/action-dispatch/routing/mapper.ts:893`), a deviation
from the Rails call with no receipt.

## Acceptance criteria

- ruby-compat exports the port of `Thread.each_caller_location`, seated on its
  `Thread`, yielding the same locations `callerLocations()` answers, starting at
  the caller of the method that calls it; a block that breaks (returns the
  `BREAK` sentinel / throws the break, per ruby-compat's existing block idiom)
  stops the walk.
- The three hand sites above call it, as Rails does, and `pnpm parity:api:calls`
  stays green (delete any baseline row the convergence makes stale).
