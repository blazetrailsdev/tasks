---
title: "Port exceptions_test.rb cases 1\u201316 (:25-203)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-exceptions", "port-activejob-test-fixture-jobs"]
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

`vendor/rails/v8.0.2/activejob/test/cases/exceptions_test.rb` (383 lines) is split at `:204`. This half covers `retry_on` attempts, waits and jitter over `RetryJob`, stubbing `Kernel.rand` through `kernelRand`.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/exceptions_test.rb`: 14 cases, as `parity:test` names them:

- [ ] `:25` ExceptionsTest — "successfully retry job throwing exception against defaults"
- [ ] `:36` ExceptionsTest — "successfully retry job throwing exception against higher limit"
- [ ] `:41` ExceptionsTest — "keeps the same attempts counter for several exceptions listed in the same retry_on declaration"
- [ ] `:57` ExceptionsTest — "keeps a separate attempts counter for each individual retry_on declaration"
- [ ] `:77` ExceptionsTest — "failed retry job when exception kept occurring against defaults"
- [ ] `:84` ExceptionsTest — "failed retry job when exception kept occurring against higher limit"
- [ ] `:91` ExceptionsTest — "discard job"
- [ ] `:96` ExceptionsTest — "custom handling of discarded job"
- [ ] `:101` ExceptionsTest — "custom handling of job that exceeds retry attempts"
- [ ] `:106` ExceptionsTest — "long wait job"
- [ ] `:121` ExceptionsTest — "polynomially retrying job includes jitter"
- [ ] `:144` ExceptionsTest — "retry jitter uses value from ActiveJob::Base.retry_jitter by default"
- [ ] `:171` ExceptionsTest — "random wait time for default job when retry jitter delay multiplier value is between 1 and 2"
- [ ] `:188` ExceptionsTest — "random wait time for polynomially retrying job when retry jitter delay multiplier value is between 1 and 2"

## Acceptance criteria

- [ ] All 14 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
