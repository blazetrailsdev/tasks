---
title: "Fold setCallback/skipCallback's kind parameter into Rails' variadic filter list"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6493
claim: "2026-08-13T20:57:11Z"
assignee: "converge-hash-to-message-construction-order"
blocked-by: null
closed-reason: null
---

## Context

Rails `set_callback(name, *filter_list, &block)` / `skip_callback(name, *filter_list, &block)`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb:737,785`) carry the
callback TYPE inside the filter list — `normalize_callback_params` shifts it off
the head when `CALLBACK_FILTER_TYPES.include?(filters.first)`, defaulting to
`:before` (`:698`). That is why `set_callback :save, :before_method` (no type) is
legal and documented (`:709-714`).

trails keeps `kind` as its own required positional parameter:
`setCallback(target, name, kind, ...filterList)` / `skipCallback(...)`
(`packages/activesupport/src/callbacks.ts`). PR #6491 made the filter list
variadic and now reconstructs Rails' list by putting `kind` back at the head
(`normalizeCallbackParams([kind, ...filterList], null)`), so the `type` shift and
`extract_options!` split are the ported ones — but the public signature still
differs from Rails, and the type-omitted form (`setCallback(target, "save", filter)`)
cannot be spelled.

## Converged shape

`kind` folds into the variadic list: `setCallback(target, name, ...filterList)`,
with `normalizeCallbackParams` alone deciding the type and defaulting to
`"before"` (`callbacks.rb:698`). Same for `skipCallback`. The `target` parameter
stays — it is the trails stand-in for Ruby's implicit `self` receiver.

Every call site passes the kind as the first filter instead of as a positional
argument (`packages/activesupport/src/callbacks.ts` re-exports and
`CallbacksMixin`, `packages/activemodel/src/callbacks.ts`,
`packages/actionpack/src/abstract-controller/callbacks.ts:287`,
`packages/activesupport/src/current-attributes.ts:109,120`, plus tests).

## Acceptance criteria

1. `setCallback`/`skipCallback` take `(target, name, ...filterList)`; the type
   comes from `normalizeCallbackParams` and defaults to `"before"` (`callbacks.rb:698`).
2. The type-omitted form works, matching the documented
   `set_callback :save, :before_method` (`callbacks.rb:713`).
3. All call sites converged; no wrapper retains a separate `kind` parameter.
4. `pnpm parity:api`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args`
   green; `pnpm parity:test` non-negative.
