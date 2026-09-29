---
title: "Port exceptions_test.rb cases 17\u201330 (:205-383)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-exceptions",
    "port-activejob-globalid-argument-arm",
    "port-activejob-test-fixture-jobs",
  ]
deps-rfc: []
est-loc: 350
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The second half: `discard_on`, `after_discard` (`AfterDiscardRetryJob`), custom handlers and the `DeserializationError` retry over `Person.new(404)` (`:308-311`, hence the GlobalID dep).

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/exceptions_test.rb`: 16 cases, as `parity:test` names them:

- [ ] `:205` ExceptionsTest — "random wait time for negative jitter value"
- [ ] `:222` ExceptionsTest — "retry jitter disabled with nil"
- [ ] `:236` ExceptionsTest — "retry jitter disabled with zero"
- [ ] `:250` ExceptionsTest — "custom wait retrying job"
- [ ] `:268` ExceptionsTest — "use individual execution timers when calculating retry delay"
- [ ] `:294` ExceptionsTest — "successfully retry job throwing one of two retryable exceptions"
- [ ] `:303` ExceptionsTest — "discard job throwing one of two discardable exceptions"
- [ ] `:308` ExceptionsTest — "successfully retry job throwing DeserializationError"
- [ ] `:313` ExceptionsTest — "successfully retry job throwing UnlimitedRetryError a few times"
- [ ] `:321` ExceptionsTest — "running a job enqueued by AJ 5.2"
- [ ] `:332` ExceptionsTest — "running a job enqueued and attempted under AJ 5.2"
- [ ] `:346` ExceptionsTest — "#after_discard block is run when an unhandled error is raised"
- [ ] `:354` ExceptionsTest — "#after_discard block is run when #retry_on is passed a block"
- [ ] `:360` ExceptionsTest — "#after_discard block is only run once when an error class and its superclass are handled by separate #retry_on calls"
- [ ] `:367` ExceptionsTest — "#after_discard is run when a job is discarded via #discard_on"
- [ ] `:373` ExceptionsTest — "#after_discard is run when a job is discarded via #discard_on with a block passed to #discard_on"

## Acceptance criteria

- [ ] All 16 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
