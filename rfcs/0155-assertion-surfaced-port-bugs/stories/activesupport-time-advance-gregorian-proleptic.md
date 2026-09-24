---
title: "Time#advance across the 1582 calendar reform does not match Rails"
status: claimed
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-24T16:59:06Z"
assignee: "pnpm12-lockfile-package-manager-document-churn"
blocked-by: null
closed-reason: null
---

## Context

Parked test `advance gregorian proleptic` in `packages/activesupport/src/core-ext/time-ext.test.ts` (converged 6 assertions). Rails `test_advance_gregorian_proleptic` (`vendor/rails/activesupport/test/core_ext/time_ext_test.rb:673-680`) e.g. `Time.local(1582, 10, 15).advance(days: -1) == Time.local(1582, 10, 14)`. The old port only asserted `getDate()` for two of them. Not run to failure before parking; the cause (Temporal is proleptic Gregorian, Ruby `Time#advance` uses `to_date.advance`) is a hypothesis.

## Acceptance criteria

- All six assertions pass; test un-skipped.
