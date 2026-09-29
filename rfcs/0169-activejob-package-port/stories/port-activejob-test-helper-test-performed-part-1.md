---
title: "Port test_helper_test.rb PerformedJobsTest cases 1\u201342 (:829-1227)"
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

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb` `PerformedJobsTest` (`:827-2114`, inside `if adapter_is?(:test)`, `:828`) has 126 cases; this story ports 1–42: `perform_enqueued_jobs` with and without a block, `only:` / `except:` / `queue:` / `at:`, and jobs that raise (`RaisingJob`, `RescueJob`).

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb`: 42 cases, as `parity:test` names them:

- [ ] `:831` PerformedJobsTest — "perform enqueued jobs with only option doesnt leak outside the block"
- [ ] `:839` PerformedJobsTest — "perform enqueued jobs without block with only option doesnt leak"
- [ ] `:845` PerformedJobsTest — "perform enqueued jobs with except option doesnt leak outside the block"
- [ ] `:853` PerformedJobsTest — "perform enqueued jobs without block with except option doesnt leak"
- [ ] `:859` PerformedJobsTest — "perform enqueued jobs with queue option doesnt leak outside the block"
- [ ] `:867` PerformedJobsTest — "perform enqueued jobs without block with queue option doesnt leak"
- [ ] `:873` PerformedJobsTest — "perform enqueued jobs with block"
- [ ] `:882` PerformedJobsTest — "perform enqueued jobs without block"
- [ ] `:891` PerformedJobsTest — "perform enqueued jobs with block with only option"
- [ ] `:901` PerformedJobsTest — "perform enqueued jobs without block with only option"
- [ ] `:911` PerformedJobsTest — "perform enqueued jobs with block with except option"
- [ ] `:921` PerformedJobsTest — "perform enqueued jobs without block with except option"
- [ ] `:931` PerformedJobsTest — "perform enqueued jobs with block with queue option"
- [ ] `:942` PerformedJobsTest — "perform enqueued jobs without block with queue option"
- [ ] `:953` PerformedJobsTest — "perform enqueued jobs with block with only and queue options"
- [ ] `:964` PerformedJobsTest — "perform enqueued jobs without block with only and queue options"
- [ ] `:975` PerformedJobsTest — "perform enqueued jobs with block with except and queue options"
- [ ] `:986` PerformedJobsTest — "perform enqueued jobs without block with except and queue options"
- [ ] `:997` PerformedJobsTest — "perform enqueued jobs with at with job performed now"
- [ ] `:1005` PerformedJobsTest — "perform enqueued jobs with at with job wait in past"
- [ ] `:1013` PerformedJobsTest — "perform enqueued jobs with at with job wait in future"
- [ ] `:1021` PerformedJobsTest — "perform enqueued jobs block with at with job performed now"
- [ ] `:1029` PerformedJobsTest — "perform enqueued jobs block with at with job wait in past"
- [ ] `:1037` PerformedJobsTest — "perform enqueued jobs block with at with job wait in future"
- [ ] `:1045` PerformedJobsTest — "perform enqueued jobs properly count job that raises"
- [ ] `:1055` PerformedJobsTest — "perform enqueued jobs dont perform retries"
- [ ] `:1066` PerformedJobsTest — "perform enqueued jobs without block removes from enqueued jobs"
- [ ] `:1075` PerformedJobsTest — "perform enqueued jobs without block works with other helpers"
- [ ] `:1088` PerformedJobsTest — "perform enqueued jobs without block only performs once"
- [ ] `:1096` PerformedJobsTest — "assert performed jobs"
- [ ] `:1104` PerformedJobsTest — "repeated performed jobs calls"
- [ ] `:1119` PerformedJobsTest — "assert performed jobs message"
- [ ] `:1130` PerformedJobsTest — "assert performed jobs with no block"
- [ ] `:1147` PerformedJobsTest — "assert no performed jobs with no block"
- [ ] `:1153` PerformedJobsTest — "assert no performed jobs"
- [ ] `:1161` PerformedJobsTest — "assert performed jobs too few sent"
- [ ] `:1171` PerformedJobsTest — "assert performed jobs too many sent"
- [ ] `:1182` PerformedJobsTest — "assert no performed jobs failure"
- [ ] `:1192` PerformedJobsTest — "assert performed jobs with only option"
- [ ] `:1201` PerformedJobsTest — "assert performed jobs with only option as proc"
- [ ] `:1210` PerformedJobsTest — "assert performed jobs without block with only option"
- [ ] `:1219` PerformedJobsTest — "assert performed jobs without block with only option as proc"

## Acceptance criteria

- [ ] All 42 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
