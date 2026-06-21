---
title: "PG multirange TypeMapInitializer is a trails-only extension beyond vendored Rails"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3779
claim: "2026-06-21T03:26:44Z"
assignee: "multirange-typemap-initializer-vs-vendored-rails"
blocked-by: null
---

## Context

trails' `TypeMapInitializer` (packages/activerecord/src/connection-adapters/
postgresql/oid/type-map-initializer.ts) extends the **vendored** Rails copy
(vendor/rails/.../postgresql/oid/type_map_initializer.rb) with multirange
support the vendored file lacks:

- `queryConditionsForKnownTypeTypes()` emits `typtype IN ('r','e','d','m')`;
  vendored Rails emits only `('r','e','d')`.
- `registerMultirangeType(row)` exists with a `MultiRangeType` registration and
  a typname naming-convention fallback (`int4multirange` → `int4range`) for the
  real-PG `typelem = 0` multirange shape. Vendored Rails has no
  `register_multirange_type` at all.

This was confirmed while doing pg-typemap-eager-load-vs-lazy-defer (PR #3532):
the eager `load_additional_types` and skip-on-miss convergence are now faithful
to vendored Rails, but the multirange path is a trails-only extension that is
NOT validated against any Rails source. Current Rails (7.2+) DOES ship
multirange handling in `OID::TypeMapInitializer`; the vendored snapshot is
simply older.

## Acceptance criteria

- [x] Re-vendor or diff against current upstream Rails
      `postgresql/oid/type_map_initializer.rb` to obtain the canonical
      multirange registration (`register_multirange_type`, the `'m'` typtype
      condition, and how Rails resolves the range subtype for `typelem = 0`).
- [x] Converge trails' `registerMultirangeType` + `queryConditionsForKnownTypeTypes`
      to match the real Rails implementation 1:1 (method name, query shape,
      subtype-resolution strategy), or document any deliberate residual
      divergence as tracked-pending-convergence.
- [x] Keep PG array/range/multirange introspection + schema-dump tests green.
