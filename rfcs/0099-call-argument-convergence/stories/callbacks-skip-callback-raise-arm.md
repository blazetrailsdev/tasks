---
title: "callbacks-skip-callback-raise-arm"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6491
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Callbacks::ClassMethods#skip_callback`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb:785-808`)
defaults `options[:raise] = true` (`:788`) and raises
`ArgumentError, "#{type.to_s.capitalize} #{name} callback #{filter.inspect} has not been defined"`
(`:795`) when no chain entry matches the filter.

trails' `skipCallback` (`packages/activesupport/src/callbacks.ts`) never
raises: an unmatched filter is a silent no-op. PR #6491 ported the variadic
filter list and the `:if`/`:unless` `merge_conditional_options` arm (`:799-801`)
but deliberately left the `:raise` arm out — turning it on flips behaviour for
every existing caller that skips a possibly-absent callback, including trails'
own "remove every callback of this kind" arm (`skipCallback(target, name, kind)`
with no filters, exercised by `packages/activesupport/src/callback-inheritance.test.ts`),
`skipCallbackOnProto` in `packages/activemodel/src/callbacks.ts:424` (which
pre-checks and returns a boolean), and the actionpack/activerecord skip paths.

Rails coverage to converge onto: `callbacks_test.rb:1201-1202`
(`assert_raises(ArgumentError) { klass.skip_callback :save, :before, :tweedle, if: "true" }`).

## Acceptance criteria

1. `skipCallback` defaults `raise` to `true` and raises Rails' `ArgumentError`
   with Rails' message when no callback matches, mirroring `callbacks.rb:788,795`.
2. `raise: false` suppresses it (`:788`).
3. Callers that relied on the silent no-op are converged or pass `raise: false`
   with a Rails cite; the no-filter "remove all of this kind" arm is either
   removed (Rails' loop does nothing with an empty filter list) or justified
   at the call site.
4. `pnpm parity:api`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args`
   green; `pnpm parity:test` non-negative.
