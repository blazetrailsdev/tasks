---
title: "activejob-continuation-v8-1"
status: draft
updated: 2026-11-21
rfc: "0196-solid-stack"
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

`vendor/solid_queue/v1.7.2/test/integration/continuation_test.rb` exercises `ActiveJob::Continuation` (`ContinuableJob`, interrupt and resume between steps). The vendored activejob is v8.0.2 and has no `active_job/continuation` (it arrived in Rails 8.1), so Rails' own file returns on its LoadError (`continuation_test.rb:5-9`). trails parks both tests as `it.skip` under `BLOCKED: activejob-continuation-v8-1` in `packages/solid-queue/test/integration/continuation.test.ts`.

## Acceptance criteria

- Once the vendored activejob includes `ActiveJob::Continuation`, port it and solid_queue's continuation support, then unskip both `ContinuationTest` tests with their v1.7.2 bodies.
