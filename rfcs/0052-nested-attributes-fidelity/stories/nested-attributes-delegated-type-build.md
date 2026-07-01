---
title: "nested-attributes-delegated-type-build"
status: ready
updated: 2026-06-30
rfc: "0052-nested-attributes-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by `converge-nested-attributes-test-one-schema`. The
`TestNestedAttributesForDelegatedType > should build a new record based on the
delegated type` case is skipped (tracked-pending-convergence) in
`packages/activerecord/src/nested-attributes.test.ts`.

Nested attributes for a `delegated_type` association are unsupported: trails
treats the delegated `entryable` as a plain polymorphic belongs_to and throws
"Cannot build association entryable" instead of instantiating the concrete
type named by `entryable_type` (Rails builds e.g. a `Message`).

## Acceptance criteria

- [ ] Build the concrete delegated type from the `*_type` column on the nested path.
- [ ] Un-skip the delegated-type case; pass with canonical `Entry`/`Message`.
