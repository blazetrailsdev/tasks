---
title: "assertions-has-many-associations-remainder-9"
status: draft
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
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

Eighth slice of `assertions-has-many-associations-remainder`. The `-8` PR converged custom/association/blank primary key on new record (rb:62-115), the four create-raises tests (rb:1041-1076), the three clears-scope tests (rb:1871-1901), find ids (rb:780) and find ids and inverse of (rb:812) in `packages/activerecord/src/associations/has-many-associations.test.ts`.

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test`.

Remaining: set ids for association on new record, reload with query cache (rb:932-970), counter-cache cluster (deleting with dependent delete all/destroy, has many without counter cache option, overlapping counter cache columns, deleting by integer id), dependence / dependence with hash condition (rb:1910), in-memory replacement, restrict with exception/error, build/new with an array, delete_all when not loaded, and the rest of the ~90 remaining rows.

Known blockers: rb:2506 transaction proxy; rb:1764 (`has-many-delete-nullify-out-of-scope`); multi-extension (`collection-proxy-extend-super-chain`).

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus re-filed remainder. Parked tests use `it.skip` with a `BLOCKED:` line.
