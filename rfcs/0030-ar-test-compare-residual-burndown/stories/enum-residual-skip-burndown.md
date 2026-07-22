---
title: "enum-residual-skip-burndown"
status: done
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 18
pr: 5087
claim: "2026-07-22T22:23:06Z"
assignee: "enum-residual-skip-burndown"
blocked-by: null
closed-reason: null
---

## Context

`test:compare` (2026-07-22) reports 12 matchedSkipped in `enum.test.ts` — all
body-less `it.skip(..., () => {})` stubs (packages/activerecord/src/enum.test.ts
lines 596-597, 901-905, 1002-1004, 1024, 1064):

- validate uniqueness; validate inclusion of value in array
- :\_default/:\_prefix/:\_suffix/:\_scopes/:\_instance_methods is invalid in the new API (5)
- capital/unicode/mangling collision for enum names (3)
- serializable? with large number label
- enum doesn't log a warning if no clashes detected

Rails: vendor/rails/activerecord/test/cases/enum_test.rb. Port real bodies;
anything genuinely Ruby-only goes permanent-skip with a recorded reason per the
RFC Deferred table.

## Acceptance criteria

- [ ] Each stub gets a faithful body and passes, or is reclassified
      permanent-skip with a recorded reason.
- [ ] enum.test.ts matchedSkipped drops accordingly; no new gate-mismatches.
