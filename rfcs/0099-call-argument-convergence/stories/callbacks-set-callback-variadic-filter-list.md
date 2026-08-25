---
title: "callbacks-set-callback-variadic-filter-list"
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
claim: "2026-08-13T19:35:39Z"
assignee: "callbacks-set-callback-variadic-filter-list"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Callbacks::ClassMethods#set_callback`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb:659`) is
variadic: `set_callback(name, *filter_list, &block)`, and
`normalize_callback_params` (`:697-702`) splits that list with
`filters.extract_options!` — a TRAILING Hash is the options bag, everything
before it is a filter.

trails' `setCallback` (`packages/activesupport/src/callbacks.ts:1325-1331`)
takes exactly one `callback` plus a separate `options` parameter, so a Rails
call registering several filters at once cannot be spelled. The blocker is
that Ruby discriminates by CLASS (`Hash` vs a callback object) where TS sees
two plain objects: an options bag (`if` / `unless` / `prepend`) and a
CallbackObject filter (`before` / `after` / `around` methods) are both
`typeof "object"`.

Surfaced by PR #6377, which added the Symbol-name filter arm and Rails'
`append_one` / `prepend_one` / `remove_duplicates` dedup. With those in
place, `ExcludingDuplicatesCallbackTest#test_excludes_duplicates_in_separate_calls`
(`callbacks_test.rb:943-947`) converged onto Rails' assertion, but
`test_excludes_duplicates_in_one_call` (`:949-952`) could not: its class
`DuplicatingCallbacksInSameCall` (`:813-815`) is
`set_callback :save, :before, :first, :second, :first, :third` — one call,
four filters. That trails test still carries its pre-existing weakened
`cb`/`count === 1` shape.

## Acceptance criteria

1. `setCallback` accepts a variadic filter list, mirroring
   `set_callback(name, *filter_list, &block)` and its
   `normalize_callback_params` split, with the options bag identified the way
   Ruby's `extract_options!` identifies it (document the discriminator chosen
   for the CallbackObject-vs-options ambiguity at the call site).
2. `skipCallback` (`skip_callback`, `callbacks.rb:679`) takes the same
   treatment — it is `*filter_list` too.
3. `packages/activesupport/src/callbacks.test.ts`
   `ExcludingDuplicatesCallbackTest` > `excludes duplicates in one call`
   registers the four filters in ONE `setCallback` call and asserts Rails'
   `["two", "one", "three", "yielded"]`, matching `callbacks_test.rb:949-952`.
4. `pnpm parity:api`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args`
   green; `pnpm parity:test` non-negative.
