---
title: "callbacks-around-loop-drives-compiled-sequence"
status: done
updated: 2026-07-08
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4770
claim: "2026-07-08T02:28:23Z"
assignee: "callbacks-around-loop-drives-compiled-sequence"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to option (a) of
`callbacks-runner-uses-compiled-calltemplate-sequence`.

The first PR wires `CallbackChain.compile()` to build the real
Rails-shaped `CallbackSequence` and drives the no-around common path
(`final?`) through the compiled `invokeBefore`/`invokeAfter` filters,
with async threaded through. See Rails `run_callbacks`
(`vendor/rails/activesupport/lib/active_support/callbacks.rb`, the
`if next_sequence.final?` branch).

To stay under 500 LOC, chains that contain around callbacks still fall
back to the bespoke `CallbackChain._invoke` in the interim, leaving the
before/after phase transiently duplicated.

## Acceptance criteria

- [ ] Port Rails' around loop (the `invoke_sequence` Proc walking
      `next_sequence.nested` via `expand_call_template` +
      `target.send(method, *args, &block)`) into `CallbackSequence.invoke`,
      threading async with the same fire-and-forget and awaited-rescue
      semantics `_runAroundAndAfter` provides today.
- [ ] Delete `_invoke`, `_runAfters`, `_runAroundAndAfter`; the compiled
      sequence is the sole engine for all chains.
- [ ] Existing callback tests stay green; no test renamed.
- [ ] Behavior matches Rails.
