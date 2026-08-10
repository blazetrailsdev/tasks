---
title: "assign-attributes-defers-nested-parameter-hashes"
status: done
updated: 2026-08-03
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6003
claim: "2026-08-03T18:29:43Z"
assignee: "assign-attributes-defers-nested-parameter-hashes"
blocked-by: null
closed-reason: null
---

## Context

Rails' `_assign_attributes` (`vendor/rails/activerecord/lib/active_record/attribute_assignment.rb:6-22`)
buckets every Hash-valued key into `nested_parameter_attributes` and assigns
those only after the scalar pass — "Assign any deferred nested attributes after
the base attributes have been set" (:25), via
`assign_nested_parameter_attributes` (:26-28). So a nested writer's `reject_if`,
the built record's callbacks, and the association's `initialize_attributes` all
observe an owner whose own attributes are already assigned.

PR #5997 ported that ordering into `assignUpdateAttributes`
(`packages/activerecord/src/persistence.ts`), the raw loop standing in for
`_assign_attributes` on the `#update` path, because routing nested-attribute
keys through the awaitable `set#{Name}Attributes` writer made the ordering
observable there.

`Base#assignAttributes` (`packages/activerecord/src/persistence.ts`, the
`export function assignAttributes` near the multiparameter branch) is the _same_
Rails method reached from `assign_attributes` / `new`, and it still assigns in a
single pass in raw hash order: no `nested_parameter_attributes` bucket, so a
Hash-valued key is assigned wherever it happens to sit in the literal. It does
already split multiparameter keys out (`hasMultiparameterKeys` /
`extractMultiparameterCallstack`), which is Rails' _other_ deferred bucket from
the same method — the nested-hash bucket is the missing half.

Out of scope for #5997, which only touched the `#update` dispatch.

## Acceptance criteria

- [ ] `assignAttributes` buckets Hash-valued keys and assigns them after the
      scalar pass, mirroring `_assign_attributes` (:7-22) +
      `assign_nested_parameter_attributes` (:26-28).
- [ ] Ordering matches Rails when multiparameter keys are ALSO present: Rails
      runs `assign_nested_parameter_attributes` BEFORE
      `assign_multiparameter_attributes` (:21-22); the current multiparameter
      branch returns early, so check it does not skip the nested pass.
- [ ] A regression test that fails on baseline — e.g. a `reject_if` (or a nested
      build) that reads an owner attribute assigned by the same
      `assignAttributes` call, with the nested key placed first in the literal.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
