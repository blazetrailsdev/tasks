---
title: "Parameters convert_value_to_parameters, delete and _deep_transform_keys_in_object are not the Rails bodies"
status: draft
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left non-Rails in `packages/actionpack/src/action-controller/metal/strong-parameters.ts`
after trails#8605 moved `@parameters` onto `HashWithIndifferentAccess`. Rails
lines are `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`.

- `convert_value_to_parameters` (`:1126-1138`): the Array arm returns `value`
  when `converted_arrays.member?(value)`, else maps and records
  `converted_arrays << converted.dup`; the Hash arm is
  `self.class.new(value, @logging_context)`. trails' `_convertValueToParameters`
  never reads `convertedArrays`, returns the input array when no element
  changed, and builds the Hash arm through `_newWithInheritedPermitted`, so a
  nested Parameters inherits `permitted` where Rails' starts from
  `permit_all_parameters`.
- `delete` (`:863-865`) is `convert_value_to_parameters(@parameters.delete(key, &block))`.
  trails' takes `...args`, accepts a positional default Rails has no parameter
  for, and branches on `has`.
- `_deep_transform_keys_in_object` / `!` (`:1140-1176`): the Parameters arm is
  `object.to_h.deep_transform_keys(&block)` or `to_unsafe_h` by `permitted?`.
  trails' recurses into `object._data` and copies `_permitted`.
- `permitted_scalar_filter` (`:1228-1240`) reads `self[key]` and writes
  `params[key] =`; trails reads and writes `_data` directly.
- `unpermitted_keys` (`:1196-1198`) is `keys - params.keys - always_permitted_parameters`;
  trails builds a `Set`.
- `each_array_element` (`:1182-1191`) is `object.grep(Parameters).filter_map(&block)`.

## Acceptance criteria

- [ ] Each method above has Rails' body, line for line, with Rails' locals.
- [ ] `delete` takes `(key, block?)` only.
- [ ] `call-mismatches-exclude/actioncontroller/metal/strong-parameters.json`
      rows these retire are deleted by hand and the mark tightened.
