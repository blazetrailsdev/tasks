---
title: "assertions-has-many-associations-remainder-10"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7964
claim: "2026-09-22T15:28:29Z"
assignee: "assertions-has-many-associations-remainder-10"
blocked-by: null
closed-reason: null
---

## Context

Ninth slice of `assertions-has-many-associations-remainder`. The `-9` PR converged destroying / destroying by integer id / by string id / a collection (rb:1800-1853), dependence (rb:1903), restrict with exception / error (rb:1982-2002) and collection not empty after building (rb:1151) in `packages/activerecord/src/associations/has-many-associations.test.ts`.

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Remaining: restrict with error with locale (trails test is bespoke — port rb:2004 with RestrictedWithErrorFirm + I18n backend), calling empty on an association (rb:3068-3096; `assertEmpty` cannot take an async `isEmpty`), counter-cache cluster (assert_difference forms), in-memory replacement, build/new with an array, delete_all when not loaded, and the remaining rows.

Known blockers: rb:2506 transaction proxy; rb:1764 (`has-many-delete-nullify-out-of-scope`); multi-extension (`collection-proxy-extend-super-chain`).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
