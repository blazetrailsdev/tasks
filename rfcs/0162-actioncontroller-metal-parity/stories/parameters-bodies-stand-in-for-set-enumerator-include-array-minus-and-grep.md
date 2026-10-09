---
title: "Parameters bodies use JS stand-ins for Set, Enumerator#include?, Array#- and grep"
status: draft
updated: 2026-10-09
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8723 gave these `ActionController::Parameters` methods Rails' bodies
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts`), but
four Ruby core calls have no ruby-compat port, so each is spelled with a JS
stand-in. Rails lines are
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`.

- `converted_arrays` (`:435-437`) is `@converted_arrays ||= Set.new`, read with
  `member?` and written with `<<` in `convert_value_to_parameters`
  (`:1181,1183`). trails' `convertedArrays` is a ruby-compat
  `Hash<unknown[], true>` read with `has` and written with `set(x, true)`,
  because membership must go by `hash` / `eql?` and ruby-compat has no `Set`.
- `has_value?` (`:997-999`) is
  `each_value.include?(convert_value_to_parameters(value))`. trails' `hasValue`
  spreads the enumerator into an array and calls `aryIncludes`, because
  ruby-compat's `Enumerator` (`packages/ruby-compat/src/enumerator.ts`) has no
  `include?`.
- `unpermitted_keys` (`:1286-1288`) is
  `keys - params.keys - always_permitted_parameters`. trails' `unpermittedKeys`
  chains two `filter(... !includes)` calls; ruby-compat has no `Array#-`
  (`rb_ary_diff`, which compares by `hash` / `eql?`).
- `each_array_element` (`:1261-1270`) is
  `object.grep(Parameters).filter_map(&block)`. trails' `eachArrayElement`
  filters with `instanceof` and calls activesupport's `filterMap`; ruby-compat
  has no `Enumerable#grep`.

## Converged shape

ruby-compat gains a `Set` keyed by `rbHash` / `rbEql`, `Enumerator#include?`,
`Array#-` and `Enumerable#grep`, each ported from MRI at its Ruby name per
`docs/ruby-ts-conventions.md`, and the four Parameters bodies call them.

## Acceptance criteria

- [ ] `convertedArrays` is a ruby-compat Set, read with its `member?` port and
      written with its `<<` port.
- [ ] `hasValue` calls the `include?` port on `this.eachValue()` with no spread.
- [ ] `unpermittedKeys` is two `Array#-` calls in Rails' order.
- [ ] `eachArrayElement`'s Array arm is the `grep` port followed by `filterMap`.
- [ ] `parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate`
      stay green; each new ruby-compat member carries its MRI citation.
