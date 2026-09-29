---
title: "Port test_helper_test.rb PerformedJobsTest cases 43\u201384 (:1228-1662)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
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

`PerformedJobsTest` cases 43–84: the `assert_performed_jobs` / `assert_no_performed_jobs` option matrix with and without a block.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/test_helper_test.rb`: 42 cases, as `parity:test` names them:

- [ ] `:1228` PerformedJobsTest — "assert performed jobs without block with only option failure"
- [ ] `:1241` PerformedJobsTest — "assert performed jobs with except option"
- [ ] `:1250` PerformedJobsTest — "assert performed jobs with except option as proc"
- [ ] `:1259` PerformedJobsTest — "assert performed jobs without block with except option"
- [ ] `:1268` PerformedJobsTest — "assert performed jobs without block with except option as proc"
- [ ] `:1277` PerformedJobsTest — "assert performed jobs without block with except option failure"
- [ ] `:1290` PerformedJobsTest — "assert performed jobs with only and except option"
- [ ] `:1301` PerformedJobsTest — "assert performed jobs without block with only and except options"
- [ ] `:1314` PerformedJobsTest — "assert performed jobs with only option as array"
- [ ] `:1324` PerformedJobsTest — "assert performed jobs with except option as array"
- [ ] `:1334` PerformedJobsTest — "assert performed jobs with only and except option as array"
- [ ] `:1346` PerformedJobsTest — "assert performed jobs with only option and none sent"
- [ ] `:1356` PerformedJobsTest — "assert performed jobs with except option and none sent"
- [ ] `:1366` PerformedJobsTest — "assert performed jobs with only and except option and none sent"
- [ ] `:1376` PerformedJobsTest — "assert performed jobs with only option and too few sent"
- [ ] `:1387` PerformedJobsTest — "assert performed jobs with except option and too few sent"
- [ ] `:1398` PerformedJobsTest — "assert performed jobs with only and except option and too few sent"
- [ ] `:1409` PerformedJobsTest — "assert performed jobs with only option and too many sent"
- [ ] `:1419` PerformedJobsTest — "assert performed jobs with except option and too many sent"
- [ ] `:1429` PerformedJobsTest — "assert performed jobs with only and except option and too many sent"
- [ ] `:1439` PerformedJobsTest — "assert performed jobs with queue option"
- [ ] `:1446` PerformedJobsTest — "assert performed jobs with queue option failure"
- [ ] `:1457` PerformedJobsTest — "assert performed jobs without block with queue option"
- [ ] `:1466` PerformedJobsTest — "assert performed jobs without block with queue option failure"
- [ ] `:1479` PerformedJobsTest — "assert performed jobs with only and queue options"
- [ ] `:1487` PerformedJobsTest — "assert performed jobs with only and queue options failure"
- [ ] `:1499` PerformedJobsTest — "assert performed jobs without block with only and queue options"
- [ ] `:1509` PerformedJobsTest — "assert performed jobs without block with only and queue options failure"
- [ ] `:1523` PerformedJobsTest — "assert performed jobs with except and queue options"
- [ ] `:1531` PerformedJobsTest — "assert performed jobs with except and queue options failure"
- [ ] `:1543` PerformedJobsTest — "assert performed jobs without block with except and queue options"
- [ ] `:1553` PerformedJobsTest — "assert performed jobs without block with except and queue options failure"
- [ ] `:1567` PerformedJobsTest — "assert no performed jobs with only option"
- [ ] `:1575` PerformedJobsTest — "assert no performed jobs without block with only option"
- [ ] `:1583` PerformedJobsTest — "assert no performed jobs without block with only option failure"
- [ ] `:1595` PerformedJobsTest — "assert no performed jobs with except option"
- [ ] `:1603` PerformedJobsTest — "assert no performed jobs without block with except option"
- [ ] `:1611` PerformedJobsTest — "assert no performed jobs without block with except option failure"
- [ ] `:1623` PerformedJobsTest — "assert no performed jobs with only and except option"
- [ ] `:1633` PerformedJobsTest — "assert no performed jobs without block with only and except options"
- [ ] `:1646` PerformedJobsTest — "assert no performed jobs with only option as array"
- [ ] `:1654` PerformedJobsTest — "assert no performed jobs with except option as array"

## Acceptance criteria

- [ ] All 42 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
