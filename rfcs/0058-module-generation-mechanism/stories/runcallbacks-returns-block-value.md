---
title: "runCallbacks returns the block value, not a boolean (Rails run_callbacks parity)"
status: done
updated: 2026-07-21
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 30
pr: 5015
claim: "2026-07-20T22:46:43Z"
assignee: "runcallbacks-returns-block-value"
blocked-by: null
closed-reason: null
---

## Context

trails' `runCallbacks` / `CallbackSequence.invoke`
(packages/activesupport/src/callbacks.ts) returns `boolean | Promise<boolean>`
— whether the final block ran without the chain halting. Rails'
`run_callbacks` returns the **block's return value** (`env.value`) on success,
and `false` only when halted (activesupport/lib/active_support/callbacks.rb:107,
the `run_callbacks` method: `env.value` is returned).

This surfaced porting Rails' `test_block_result_is_returned` (callbacks_test.rb,
UsingObjectTest): `CustomScopeObject#save` returns `"CallbackResult"` from
`run_callbacks :save do ...; "CallbackResult" end`. trails can't assert this —
`runCallbacks` yields `true`, not the block value — so the trails port keeps a
side-effect check ("block result is returned" in
packages/activesupport/src/callbacks.test.ts) instead of asserting the returned
value. AroundCallbackResultTest (callbacks.test.ts) works around the same gap.

## Acceptance criteria

- [ ] `runCallbacks` returns the run block's value (`env.value`) on a
      non-halted, non-conditional-skip run, matching Rails `run_callbacks`
      returning `env.value`; returns `false` when the chain halts.
- [ ] Port Rails `test_block_result_is_returned` verbatim through the public API,
      asserting the returned value equals `"CallbackResult"` (not a side effect).
- [ ] Audit callers of `runCallbacks` across activemodel/activerecord that rely
      on the current boolean return (e.g. `valid?`, save/persistence gates) and
      confirm they still read truthiness correctly, or adjust the call sites.

## Notes

Wider blast radius than a leaf deviation — many callers treat the boolean as a
halt signal. The return contract change must preserve `false`-on-halt while
surfacing the block value otherwise; a truthy non-boolean block value must not
break existing `if (runCallbacks(...))` gates.
