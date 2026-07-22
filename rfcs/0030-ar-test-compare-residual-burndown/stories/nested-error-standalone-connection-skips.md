---
title: "nested-error-standalone-connection-skips"
status: ready
updated: 2026-07-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
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

`test:compare` (2026-07-22): two files are 100% skipped stubs (0 matched):

- `associations/nested-error.test.ts` — 4 it.skip stubs (lines 4,12,18,25):
  index in association order / in nested attributes order / unaffected by
  reject_if / no index when singular association. Rails:
  vendor/rails/activerecord/test/cases/associations/nested_error_test.rb
  (error `index` on nested-attributes errors).
- `connection-adapters/standalone-connection.test.ts` — 4 it.skip stubs
  (lines 4,9,14,19): can query / async fallback / can throw away / can close.
  Rails: vendor/rails/activerecord/test/cases/connection_adapters/
  standalone_connection_test.rb.

## Acceptance criteria

- [ ] All 8 stubs get faithful bodies and pass, or are reclassified
      permanent-skip with recorded reasons.
- [ ] Both files' matchedSkipped drops accordingly; no new gate-mismatches.
