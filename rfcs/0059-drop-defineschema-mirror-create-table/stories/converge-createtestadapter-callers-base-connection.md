---
title: "converge-createtestadapter-callers-base-connection"
status: draft
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
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

RFC 0059 follow-up split from `converge-sidecar-pool-rides-canonical-schema`.
Converges the ~18 `createTestAdapter()` convenience callers (which lease from
the sidecar `_pool`) onto `Base.connection`, mirroring Rails' single-pool test
model. **Rails has no sidecar pool** (`grep -r sidecar
vendor/rails/activerecord/test` = 0).

Files (packages/activerecord/src/): the `associations/join-dependency-*` suite
(alias-tracker, belongs-to-dedup, duplicate-objects, extra-columns,
nested-hydration, polish, quoting, spec, through-aliasing, walk),
`associations/{collection-proxy-count,loader-methods,reload-owner-repoint,
sti-owner-through-foreign-key}.test.ts`,
`persistence/reload-association-cache.test.ts`, and the `test-helpers/*`
self-tests that only lease from `_pool` for convenience.

Pattern: establish `Base.connection` via `setupFixtures()`/`setupHandlerSuite()`
and ride the boot-laid canonical schema; drop any now-unnecessary in-test
`create_table` workarounds. Reference the shipped `relation.trails.test.ts`
isBlank conversion.

## Acceptance criteria

- The `createTestAdapter` convenience callers ride `Base.connection`. Bespoke
  `create_table` workarounds that only existed because the sidecar handle
  lacked the boot-laid schema are removed. No test renames; `test:compare`
  delta >= 0.
- Read the corresponding Rails test for each converted suite first.
