---
title: "CallbackChain#compile drops Rails' type arm and its per-type memo"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6710
claim: "2026-08-18T18:37:42Z"
assignee: "port-test-date-sub-class-propagation"
blocked-by: null
closed-reason: null
---

## Context

`CallbackChain#compile` in
`packages/activesupport/src/callbacks.ts:1138` takes no arguments and memoizes
into a single `_allCallbacks`. Rails takes a `type` and keeps a SECOND memo
(`vendor/rails/activesupport/lib/active_support/callbacks.rb:614-630`):

```ruby
def compile(type)
  if type.nil?
    @all_callbacks || @mutex.synchronize do
      final_sequence = CallbackSequence.new
      @all_callbacks ||= @chain.reverse.inject(final_sequence) do |callback_sequence, callback|
        callback.apply(callback_sequence)
      end
    end
  else
    @single_callbacks[type] || @mutex.synchronize do
      final_sequence = CallbackSequence.new
      @single_callbacks[type] ||= @chain.reverse.inject(final_sequence) do |callback_sequence, callback|
        type == callback.kind ? callback.apply(callback_sequence) : callback_sequence
      end
    end
  end
end
```

The `type` arm filters the chain to callbacks of ONE kind
(`type == callback.kind`), skipping the rest, and memoizes per type in
`@single_callbacks`. `initialize_copy` (callbacks.rb:607-612) resets both memos.

It is reachable from the public API: `run_callbacks(kind, type = nil)`
(callbacks.rb:96-104) forwards its second argument straight into
`callbacks.compile(type)`. trails' `runCallbacks` has no such parameter and its
one call site (callbacks.ts:1447) is a bare `chain.compile()`, so a caller that
wants only the `:before` callbacks of a chain cannot express it and would run
the whole chain.

trails also has no `_singleCallbacks` memo, so the field-reset sites that clear
`_allCallbacks` (callbacks.ts:1093-1134) would each need to clear it too.

Surfaced while renaming this method's accumulator to `callbackSequence` in RFC
0096 wave 3 (PR #6513) — the rename made the missing branch obvious.

## Converged shape

`compile(type?)` carrying both arms and both memos, `runCallbacks(kind, type?)`
forwarding it, and every site that invalidates `_allCallbacks` invalidating
`_singleCallbacks` alongside it.

## Acceptance criteria

- [ ] `CallbackChain#compile` takes `type` and has Rails' two branches, with a
      per-type memo beside `_allCallbacks`.
- [ ] `runCallbacks` accepts and forwards `type`, per callbacks.rb:96-104.
- [ ] Every `_allCallbacks = undefined` site clears the per-type memo too.
- [ ] A test drives `runCallbacks(kind, type)` and asserts only that kind's
      callbacks run; it fails on the baseline.
