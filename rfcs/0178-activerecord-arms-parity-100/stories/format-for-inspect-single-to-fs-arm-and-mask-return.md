---
title: "activerecord: format-for-inspect-single-to-fs-arm-and-mask-return"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8726
claim: "2026-10-09T20:09:43Z"
assignee: "core-inherited-seeding-leaves-the-generated-modules-and-find-by-cache-readers"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/attribute-methods.ts` `formatForInspect` mirrors
`format_for_inspect` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:527-541`)
except for two residues. Rails has one `value.is_a?(Date) || value.is_a?(Time)` arm calling
`value.to_fs(:inspect)`; trails has four arms (`Temporal.PlainDate`, `TimeWithZone`,
`Temporal.Instant` / `Time`, and a legacy JS `Date` boundary with its own NaN ternary),
because `to_fs` is three free functions in activesupport
(`core-ext/date/conversions.ts`, `core-ext/time/conversions.ts`, `TimeWithZone#toFs`) with
no single dispatch. And Rails returns `inspection_filter.filter_param(name, inspected_value)`
as is, where trails unwraps an `InspectionMask` with a ternary because
`String(new InspectionMask(...))` raises (`DelegateClass(String)` has no working `toString`).
Reported as `attribute-methods.ts#formatForInspect +if +if +if +if +if`; carries `@inventedArm if`.

## Acceptance criteria

- [ ] One date/time arm calling one `to_fs(:inspect)` dispatch, as `attribute_methods.rb:533-534`.
- [ ] The JS `Date` boundary arm is gone, or its producer is.
- [ ] `formatForInspect` returns `filterParam`'s value with no `InspectionMask` ternary.
- [ ] The `@inventedArm if` receipt is deleted and the invented report shows no row.
