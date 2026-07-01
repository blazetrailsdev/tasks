---
rfc: "0055-serialization-fidelity"
title: "Serialization fidelity"
status: draft
created: 2026-07-01
updated: 2026-07-01
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC 0055 — Serialization fidelity

## Summary

Converge attribute serialization onto Rails across two surfaces: the serialized
column type (`packages/activerecord/src/type/serialized.ts`) and the
`serializable_hash` / `to_xml` / `read_attribute_for_serialization` serializer
path. Extracted from `0023-surfaced-deviations`.

## Motivation

Serialization deviations surfaced across several PRs — serialized-column cast/dirty
semantics diverge from Rails' `Mutable#cast` and content-equality dirty tracking,
and the ActiveModel serializer path has scalar-coercion, pure-`send`, and
runtime-typed `to_xml` gaps. None had a topical home.

## Design

Serialized column type:

- `cast` serializes-first like `Mutable#cast`.
- nil assignment marks changed before cast per Rails (not dirty).
- `isChanged` uses content equality for HWIA, not reference equality.
- `where`-predicate values serialize through the coder for serialized columns.

Serializer path:

- `read_attribute_for_serialization` is pure `send` (drop store/attributes
  fallbacks).
- `serializable_hash` coerces scalar `only`/`except` via `Array()`.
- `to_xml` `type=` attribute is column-typed, not JS-runtime-typed.
- Rewrite the hollow ActiveModel "nested include" test to mirror Rails
  `test_nested_include`.

## Non-goals

- **New serialization coders/formats:** convergence of existing behavior only.

## Rollout

1. Serialized column type stories (cast → nil-dirty → isChanged → where-coder).
2. Serializer path stories (read_attribute_for_serialization, serializable_hash,
   to_xml, nested-include test).

May be split into `serialized-column-type-fidelity` + serializer stories if the
two halves diverge in scheduling.

## Verification

Serialized-attribute and serialization tests pass on all lanes; `to_xml` type=
matches Rails on PG/MariaDB BigInt ids.

## Open questions

None outstanding.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
