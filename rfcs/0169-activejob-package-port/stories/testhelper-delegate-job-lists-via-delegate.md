---
title: "Converge TestHelper enqueued_jobs/performed_jobs onto delegate (fix delegate reader+writer pair)"
status: done
updated: 2026-10-22
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9223
claim: "2026-10-22T15:46:39Z"
assignee: "port-activejob-test-helper-test-performed-part-3"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb:9-11` is `delegate :enqueued_jobs, :enqueued_jobs=, :performed_jobs, :performed_jobs=, to: :queue_adapter`. trails#9209 wrote these as four hand-written accessors on `TestHelper` in `packages/activejob/src/test-helper.ts`, because `delegate` from `packages/activesupport/src/delegation.ts` (`Delegation.generate`) mishandles the pair:

- With `to:` a method name and no `as:`, no descriptor is found, so the reader `enqueuedJobs` is defined as a data property whose value is a function. A Ruby zero-arg reader should port as an accessor (root CLAUDE.md, "Generated attribute readers are properties").
- The `enqueuedJobs=` writer then runs `Object.defineProperty(owner, "enqueuedJobs", { set })`, which replaces the data property with a setter-only accessor. Reading `enqueuedJobs` then answers `undefined`.

## Acceptance criteria

- [ ] `delegate.call(proto, "x", "x=", { to: "someMethod" })` gives `proto` one accessor whose get reads `this.someMethod().x` and whose set writes it. Covered by a `delegation` test.
- [ ] `TestHelper` uses `delegate.call(TestHelper.prototype, "enqueuedJobs", "enqueuedJobs=", "performedJobs", "performedJobs=", { to: "queueAdapter" })` as in Rails, and the hand-written accessors are deleted.
- [ ] `test-case.test.ts` passes in every AJ lane.
