---
title: "permit_filters models Rails' three-valued on_unpermitted: as a boolean suppressUnpermitted"
status: draft
updated: 2026-09-07
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `permit_filters` takes `on_unpermitted:` and passes it down every nested
call (`actionpack/lib/action_controller/metal/strong_parameters.rb:1130-1146`),
ending at `unpermitted_parameters!(params, on_unpermitted:)`
(`:1144`), whose value is one of `nil` / `:log` / `:raise` and defaults to
`self.class.action_on_unpermitted_parameters` (`:1349`). `expect` and `permit`
differ precisely by what they pass.

trails models the same kwarg as a **boolean**: `_permitFilters`'s
`options: { suppressUnpermitted?: boolean }`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:627-630`),
set by `expect` (`:162`) and read by `_permitFilters` (`:640`) to decide whether
to call `_unpermittedParameters` at all. Two arms are lost:

- The three-valued `nil` / `:log` / `:raise` choice is flattened to
  "call it or don't"; `_unpermittedParameters` (`:684-700`) then re-reads the
  class-level `actionOnUnpermittedParameters` itself, so a caller cannot pass a
  different one the way Rails' `expect` does.
- The public `permitFilters` wrapper (`:815-819`) declares the Rails-shaped
  `_options: { onUnpermitted?: "raise" | "log" | null; explicitArrays?: boolean }`
  and drops it on the floor — two names for one kwarg, neither of them Rails'.

PR #7591 threaded the boolean through `permit_value` / `permit_hash` /
`permit_array_of_hashes` / `permit_hash_or_array` (they previously called the
options-dropping public wrapper), which is where Rails threads
`on_unpermitted:`. The shape is still the port's, not Rails'.

Sibling story: `permit-value-is-missing-the-explicit-arrays-arm` covers the
other kwarg (`explicit_arrays:`) and `permit_value`'s missing fifth arm.

## Converged shape

`onUnpermitted` carrying Rails' three values, defaulted at the same place Rails
defaults it (`hash_filter`'s
`on_unpermitted: self.class.action_on_unpermitted_parameters`), threaded through
the same methods, with `unpermitted_parameters!` taking it as a parameter rather
than re-reading the class attribute. One spelling, on both `permitFilters` and
`_permitFilters`.

## Acceptance criteria

- [ ] `suppressUnpermitted` is gone; the kwarg is `onUnpermitted` with Rails'
      `null` / `"log"` / `"raise"` values.
- [ ] `unpermittedParametersBang` takes `onUnpermitted` and does not re-read
      `Parameters.actionOnUnpermittedParameters` itself.
- [ ] `permitFilters` and `_permitFilters` agree on one option shape, and the
      public wrapper no longer discards it.
- [ ] `expect` passes what `strong_parameters.rb:1042-1050` passes.
- [ ] The `parameters_permit_test.rb` / `parameters_expect_test.rb` /
      `raise_on_unpermitted_params_test.rb` / `log_on_unpermitted_params_test.rb`
      suites stay green; `pnpm parity:api:calls:args` shows no new row.
