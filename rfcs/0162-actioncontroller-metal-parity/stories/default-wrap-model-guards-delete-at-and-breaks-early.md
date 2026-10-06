---
title: "Options#_default_wrap_model guards delete_at(-2) by hand and exits its loop through an extra break"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
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

`ActionController::ParamsWrapper::Options#_default_wrap_model`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/params_wrapper.rb:162-184`)
walks a namespace up with:

    begin
      if model_klass = model_name.safe_constantize
        model_klass
      else
        namespaces = model_name.split("::")
        namespaces.delete_at(-2)
        break if namespaces.last == model_name
        model_name = namespaces.join("::")
      end
    end until model_klass

The port (`packages/actionpack/src/action-controller/metal/params-wrapper.ts`,
`Options#_defaultWrapModel`, merged in trails#8555) deviates in two places:

- `namespaces.delete_at(-2)` is `if (namespaces.length >= 2) namespaces.splice(-2, 1)`.
  `Array#delete_at` (`rb_ary_delete_at_m`, `vendor/ruby/v3.3.11/array.c`) is a
  no-op answering nil for an out-of-range index, where `splice(-2, 1)` on a
  one-element Array clamps the start to 0 and removes the only element. The
  guard is an invented `if` with no receipt. ruby-compat has no `delete_at`
  port (`grep -rn deleteAt packages/ruby-compat/src` is empty).
- The `if model_klass = ...` arm, a bare `model_klass` expression in Ruby, is
  a `break`, so the loop has two exits where Rails' has one plus the `until`.

## Acceptance criteria

- ruby-compat gains `Array#delete_at` ported from `rb_ary_delete_at_m` with its
  `@noRailsEquivalent PERMANENT` receipt and a README call-site row.
- `_defaultWrapModel` calls it with `-2` and carries no length guard.
- The loop has Rails' shape: one `break` (the `namespaces.last == model_name`
  arm) and the `until model_klass` condition.
- `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:arms:throws`
  stay green; `controller/params-wrapper.test.ts` stays green.
