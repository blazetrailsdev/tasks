---
title: "callbacks-invoke-halted-callback-hook"
status: done
updated: 2026-07-08
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 22
pr: 4771
claim: "2026-07-08T02:47:22Z"
assignee: "callbacks-invoke-halted-callback-hook"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Filters::Before#call` invokes
`target.send(:halted_callback_hook, filter, name)` when a before callback
halts the chain (`vendor/rails/activesupport/lib/active_support/callbacks.rb`,
in `Before#call`). `halted_callback_hook` is a private no-op hook on the
including class that implementors (e.g. ActiveModel) override to log/instrument
which callback halted.

trails stores `filter`/`name` on the `Before` filter (mirroring Rails'
`@filter`/`@name`) but never calls the hook — neither the retired `_invoke`
engine nor the compiled `CallbackSequence.invoke` path does. This is a
pre-existing gap, surfaced during review of the compiled-sequence
convergence (PR #4702).

## Acceptance criteria

- [ ] `Before.call` invokes a `haltedCallbackHook(filter, name)` on the target
      when it sets `env.halted`, matching Rails `Before#call`.
- [ ] Provide the default no-op hook on the callbacks host so overriding is
      opt-in, and wire ActiveModel's override if Rails has one.
- [ ] Add a test asserting the hook fires with the halting filter/name.
- [ ] Behavior matches Rails; no test renamed.
