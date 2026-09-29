---
title: "Port test_helper_test.rb PerformedJobsTest cases 85\u2013126 (:1663-2112)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-test-helper-performed-assertions",
    "port-activejob-exceptions",
    "port-activejob-test-fixture-jobs",
    "port-activejob-globalid-argument-arm",
  ]
deps-rfc: []
est-loc: 400
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PerformedJobsTest` cases 85–126: `assert_performed_with` with `at:`, `priority:`, `queue:`, proc and GlobalID `args:` matchers (`Person`), kwargs, nested jobs and failure messages.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb`: 42 cases, as `parity:test` names them:

- [ ] `:1663` PerformedJobsTest — "assert no performed jobs with only and except option as array"
- [ ] `:1673` PerformedJobsTest — "assert no performed jobs with only option failure"
- [ ] `:1684` PerformedJobsTest — "assert no performed jobs with except option failure"
- [ ] `:1695` PerformedJobsTest — "assert no performed jobs with only and except option failure"
- [ ] `:1706` PerformedJobsTest — "assert no performed jobs with queue option"
- [ ] `:1712` PerformedJobsTest — "assert no performed jobs with queue option failure"
- [ ] `:1722` PerformedJobsTest — "assert no performed jobs without block with queue option"
- [ ] `:1730` PerformedJobsTest — "assert no performed jobs without block with queue option failure"
- [ ] `:1742` PerformedJobsTest — "assert no performed jobs with only and queue options"
- [ ] `:1749` PerformedJobsTest — "assert no performed jobs with only and queue options failure"
- [ ] `:1760` PerformedJobsTest — "assert no performed jobs without block with only and queue options"
- [ ] `:1769` PerformedJobsTest — "assert no performed jobs without block with only and queue options failure"
- [ ] `:1782` PerformedJobsTest — "assert no performed jobs with except and queue options"
- [ ] `:1790` PerformedJobsTest — "assert no performed jobs with except and queue options failure"
- [ ] `:1802` PerformedJobsTest — "assert no performed jobs without block with except and queue options"
- [ ] `:1812` PerformedJobsTest — "assert no performed jobs without block with except and queue options failure"
- [ ] `:1826` PerformedJobsTest — "assert performed with"
- [ ] `:1832` PerformedJobsTest — "assert performed with without block"
- [ ] `:1840` PerformedJobsTest — "assert performed with when queue name is symbol"
- [ ] `:1846` PerformedJobsTest — "assert performed with returns"
- [ ] `:1857` PerformedJobsTest — "assert performed with without block returns"
- [ ] `:1870` PerformedJobsTest — "assert performed with failure"
- [ ] `:1884` PerformedJobsTest — "assert performed with without block failure"
- [ ] `:1900` PerformedJobsTest — "assert performed job with priority option"
- [ ] `:1912` PerformedJobsTest — "assert performed with with at option"
- [ ] `:1924` PerformedJobsTest — "assert performed with with relative at option"
- [ ] `:1936` PerformedJobsTest — "assert performed with without block with at option"
- [ ] `:1952` PerformedJobsTest — "assert performed with with hash arg"
- [ ] `:1958` PerformedJobsTest — "assert performed with supports matcher procs"
- [ ] `:1981` PerformedJobsTest — "assert performed with time"
- [ ] `:1990` PerformedJobsTest — "assert performed with date time"
- [ ] `:1999` PerformedJobsTest — "assert performed with time with zone"
- [ ] `:2008` PerformedJobsTest — "assert performed with with global id args"
- [ ] `:2015` PerformedJobsTest — "assert performed with without block with global id args"
- [ ] `:2022` PerformedJobsTest — "assert performed with failure with global id args"
- [ ] `:2034` PerformedJobsTest — "assert performed with without block failure with global id args"
- [ ] `:2047` PerformedJobsTest — "assert performed says no jobs performed"
- [ ] `:2056` PerformedJobsTest — "assert performed when not matching the class shows alteratives"
- [ ] `:2069` PerformedJobsTest — "assert performed with does not change jobs count"
- [ ] `:2082` PerformedJobsTest — "assert performed with without block does not change jobs count"
- [ ] `:2095` PerformedJobsTest — "perform_enqueued_jobs doesn't raise if discard_on ActiveJob::DeserializationError"
- [ ] `:2103` PerformedJobsTest — "TestAdapter respect max attempts"

## Acceptance criteria

- [ ] All 42 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.
- [ ] `parity:test` reads `PerformedJobsTest` at 126/126 with parts 1 and 2.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
