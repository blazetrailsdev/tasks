---
title: "merge_conditional_options takes Rails' if_option:/unless_option: kwargs and Array()s internally"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6494
claim: "2026-08-13T21:27:10Z"
assignee: "drop-assert-valid-keys-set-for-rails-include"
blocked-by: null
closed-reason: null
---

## Context

Rails `Callback#merge_conditional_options(chain, if_option:, unless_option:)`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb:410`) takes two
KEYWORD arguments and applies `Array(...)` to each internally (`:412-413`).

trails' `Callback.mergeConditionalOptions`
(`packages/activesupport/src/callbacks.ts`) takes them as two positional
`CallbackCondition[]` parameters, so the sole caller — `Callbacks.skipCallback`,
added by PR #6491 mirroring `callbacks.rb:799-801` — has to wrap each option
itself through a local `arrayWrap` helper that Rails does not have. Rails passes
`options[:if]` / `options[:unless]` straight through.

## Converged shape

`mergeConditionalOptions(chain, { ifOption, unlessOption })` — the settled trails
kwargs idiom — accepting the raw one-or-many option value and doing Ruby's
`Array()` internally, exactly where Rails does it (`:412-413`). `arrayWrap` then
has no callers and is deleted, and `skipCallback` passes `options.if` /
`options.unless` unwrapped like Rails.

## Acceptance criteria

1. `mergeConditionalOptions` takes Rails' kwargs and does the `Array()` wrap
   internally (`callbacks.rb:410-413`).
2. `Callbacks.skipCallback` passes `options.if`/`options.unless` through
   unmodified, matching `callbacks.rb:799-801`; `arrayWrap` is deleted.
3. `pnpm parity:api`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args`
   green; `pnpm parity:test` non-negative.
