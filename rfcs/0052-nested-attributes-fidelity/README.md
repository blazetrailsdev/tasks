---
rfc: "0052-nested-attributes-fidelity"
title: "Nested attributes fidelity"
status: closed
created: 2026-07-01
updated: 2026-07-06
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC 0052 — Nested attributes fidelity

## Summary

Converge `accepts_nested_attributes_for` (`packages/activerecord/src/nested-attributes.ts`)
onto Rails: synchronous in-memory handling of id-bearing/`update_only` existing
records, `reject_if: :all_blank` symbol form, association `:extend`, delegated-type
build, and `index_errors` validation propagation. Extracted from
`0023-surfaced-deviations`; all members surfaced from the same faithful test port.

## Motivation

The `converge-nested-attributes-test-one-schema` port of
`vendor/rails/activerecord/test/cases/nested_attributes_test.rb` left five cases
`it.skip`-ped as tracked-pending-convergence. The core gap is that trails defers
existing-record updates/destroys to an async flush instead of applying them
synchronously in memory the way Rails does, which also blocks indexed nested
validation.

## Design

- Rewrite the existing-record path to apply id-bearing updates and destroys
  synchronously in memory (the anchor change).
- On top of that: run indexed nested has_many validators against the assigned
  in-memory target so parent `valid?` surfaces `children[i].attr` errors.
- Support `reject_if: :all_blank` symbol form.
- Support association `:extend` on nested associations.
- Build the concrete delegated type named by `*_type` for delegated_type
  associations instead of throwing.

## Non-goals

- **CollectionProxy in-memory merge** (`collection-proxy-toarray-merge-target-lists`)
  stays in 0023 for now; fold in only if the sync rewrite naturally subsumes it.

## Rollout

1. `nested-attributes-sync-existing-record-updates` (foundation)
2. `nested-attributes-index-errors-validation` (depends on the sync path)
3. `nested-attr-reject-if-all-blank-symbol-form`,
   `nested-attributes-association-extend`,
   `nested-attributes-delegated-type-build`

## Verification

The five skipped `nested-attributes.test.ts` cases un-skip and pass on all lanes.

## Open questions

None outstanding.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
