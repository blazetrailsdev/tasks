---
title: "converge-format-for-inspect-filter-order"
status: draft
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
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

`format_for_inspect`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:527-541`)
computes `inspected_value` FIRST and then filters the resulting _string_:

```ruby
inspected_value = if value.is_a?(String) && value.length > 50
  "#{value[0, 50]}...".inspect
elsif value.is_a?(Date) || value.is_a?(Time)
  %("#{value.to_fs(:inspect)}")
else
  value.inspect
end

inspection_filter.filter_param(name, inspected_value)
```

`formatForInspect` (`packages/activerecord/src/attribute-inspection.ts:68`)
inverts the order: it calls `filter.filterParam(name, value)` on the RAW value
up front, then branches on the filtered result to format it. The two are
behaviourally equivalent under `ParameterFilter`'s mask-or-passthrough
semantics today, but the branch order is a real deviation from the Rails body
and any change to `filterParam` — a filter that transforms rather than masks,
which Rails' block-form `filter_parameters` allows — makes them diverge.

Surfaced in review of PR #7198 (which added the Date/Time arm); noted there as
pre-existing and out of scope.

## Acceptance criteria

- [ ] `formatForInspect` computes `inspectedValue` through the same three-arm
      branch Rails has, then returns `inspectionFilter.filterParam(name, inspectedValue)`.
- [ ] The `nil` early return keeps Rails' `value.nil?` position
      (`attribute_methods.rb:528-529`), before any filtering.
- [ ] `filter-attributes.test.ts` and `attribute-methods.test.ts` stay green on
      all three lanes; `pnpm parity:api:calls` / `:args` deltas non-negative.
