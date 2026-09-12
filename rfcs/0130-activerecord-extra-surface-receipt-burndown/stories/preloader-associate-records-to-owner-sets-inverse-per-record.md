---
title: "preloader-associate-records-to-owner-sets-inverse-per-record"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Preloader::Association#associateRecordsToOwner`
(`packages/activerecord/src/associations/preloader/association.ts`) calls
`association.setInverseInstance(record)` for every loaded record on every owner.
Rails' `associate_records_to_owner`
(`vendor/rails/activerecord/lib/active_record/associations/preloader/association.rb`)
never calls `set_inverse_instance`. Rails wires inverses in two places instead: the
per-record instantiation block in `load_records` (`:193`), and
`associate_records_from_unscoped`, only for the first owner (`:230-232`).

The loop predates PR #7715, which only swapped `_wireInverseAssociation` for
`setInverseInstance` without changing its shape. A reviewer flagged it on #7715.

## Acceptance criteria

- `associateRecordsToOwner` sets only the target, as Rails does.
- Inverse wiring happens at `load_records`' instantiation block and in
  `associate_records_from_unscoped` (`i == 0`), matching `:193` and `:230-232`.
- The preloader and inverse-association suites pass on all adapter lanes.
