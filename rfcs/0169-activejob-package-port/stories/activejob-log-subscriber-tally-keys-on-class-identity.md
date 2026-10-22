---
title: "LogSubscriber#enqueued_jobs_message tallies by class identity, not class name"
status: draft
updated: 2026-10-22
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/log_subscriber.rb:206-211` `enqueued_jobs_message`: `enqueued_jobs.map(&:class).tally.sort_by { |_k, v| -v }` keys the tally on class identity. The port (`packages/activejob/src/log-subscriber.ts`, `enqueuedJobsMessage`) calls activesupport `tally` (`packages/activesupport/src/enumerable-utils.ts:149`), which is typed `T extends string | number` and keys by `String(item)`. So it needs an `as never` cast, and two distinct classes sharing a `toString` collapse into one count.

## Acceptance criteria

- [ ] `tally` keys on element identity (a `Map`-backed result, as Ruby's Hash), or accepts any element type, so `enqueuedJobsMessage` passes classes with no cast.
- [ ] Two job classes with the same name are counted separately, as in Ruby.
- [ ] `sort_by { -v }` order preserved.
