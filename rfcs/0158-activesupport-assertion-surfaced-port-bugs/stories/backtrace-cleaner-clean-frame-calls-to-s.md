---
title: "backtrace-cleaner-clean-frame-calls-to-s"
status: done
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9168
claim: "2026-10-21T13:26:06Z"
assignee: "backtrace-cleaner-clean-frame-calls-to-s"
blocked-by: null
closed-reason: null
---

## Context

Rails' `BacktraceCleaner#clean_frame`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/backtrace_cleaner.rb:60-64`)
calls `to_s` on the frame twice: `frame = frame.to_s` on entry, and
`f.call(frame.to_s)` for each filter. So it accepts a
`Thread::Backtrace::Location` as well as a String. ActiveJob's log subscriber
relies on this. It passes a caller location to `clean_frame`.

trails' `cleanFrame` (`packages/activesupport/src/backtrace-cleaner.ts:56-67`)
drops both `to_s` calls and passes the raw frame to the filters and silencers.
A location object reaches a filter that does string operations and throws.

The Ruby-to-TS generator's activejob trial surfaced this (branch
`spike-ar-ruby-ir-ts-29583a`): 3 generated logging tests fail because the
generated log subscriber passes a location to the hand-ported `cleanFrame`.

## Acceptance criteria

- `cleanFrame` converts the frame to a string on entry and before each filter
  call, as Rails' body does (`rbObjAsString` / `String(frame)`).
- Its parameter type admits a non-string frame.
- A test passes a non-string frame object whose `toString` returns a path,
  and asserts that the filtered string comes back. The test must fail before
  the fix.
- `pnpm parity:api:calls` credits `to_s` in `clean_frame`, with no new rows.
