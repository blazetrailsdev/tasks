---
title: "Nested-attributes assigners omit attributes.with_indifferent_access, so reject_if sees the caller's carrier"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8767 (`mass-assignment-and-where-read-parameters-to-h-as-a-hash`).

Rails normalizes the attributes hash before reading it in both nested-attributes assigners:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/nested_attributes.rb:433`, in `assign_nested_attributes_for_one_to_one_association`: `attributes = attributes.with_indifferent_access`.
- `nested_attributes.rb:521`, in `assign_nested_attributes_for_collection_association`: `attributes = attributes.with_indifferent_access`, per element.

So every later read (`attributes["id"]`, `has_destroy_flag?`, `attributes.except(*UNASSIGNABLE_KEYS)`) and the `reject_if` callback (`call_reject_if`, `nested_attributes.rb:588-597`) sees a `HashWithIndifferentAccess`.

`packages/activerecord/src/nested-attributes.ts` omits both calls. `assignNestedAttributesForOneToOneAssociation` and `assignNestedAttributesForCollectionAssociation` pass the caller's value through unchanged, so a `reject_if` callback receives a plain object when the caller passed one and a `Hash` when the caller passed permitted params. After #8767 every read in the file goes through `hashAref` / `keys`, which is why both carriers work, and the `reject_if` callback type is `Record<string, unknown> | Map<string, unknown>`.

RFC 0190's rule is that a consumer holds an HWIA where Rails does. Rails holds one here.

## Acceptance criteria

- Both assigners call `withIndifferentAccess` (`@blazetrails/activesupport`) at the Rails position, after the `Hash` guard in the one-to-one assigner and after the per-element `to_h` in the collection assigner.
- The helpers and the `reject_if` callback are typed for the `HashWithIndifferentAccess` they then receive, and the `Record | Map` unions added by #8767 on those signatures narrow to it.
- The `reject_if` callbacks in `nested-attributes.test.ts`, `associations/nested-error.test.ts` and the `Pirate` / `Ship` test models still pass, read as Rails' procs read them.
- `pnpm parity:api:calls` and `:calls:args` green with no baseline row or receipt added.
