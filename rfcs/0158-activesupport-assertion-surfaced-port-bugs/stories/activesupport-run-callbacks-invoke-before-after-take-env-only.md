---
title: "activesupport: run_callbacks passes invoke_before / invoke_after env only"
status: done
updated: 2026-10-04
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8470
claim: "2026-10-04T01:18:08Z"
assignee: "activesupport-run-callbacks-invoke-before-after-take-env-only"
blocked-by: null
closed-reason: null
---

## Context

`runCallbacks` (`packages/activesupport/src/callbacks.ts`) passes `invokeBefore(env, opts, chainName)` and
`invokeAfter(env, opts, chainName)` at every site where `run_callbacks`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:96-141`) passes `invoke_before(env)` /
`invoke_after(env)` (`:108,110,119,134,135`). `opts` is the trails-only `RunCallbacksOptions` (`strict: "sync"`,
which makes a thenable returned by a callback or the block raise on a chain a synchronous caller runs) and
`chainName` only feeds that error's message. Both are threaded on through `CallbackSequence#_runFilters`
into `Before#call` / `After#call`.

The five rows were invisible to `parity:api:calls:args` while the free `runCallbacksOn` wrapper was the
exported `runCallbacks`; deleting it (story `activesupport-callbacks-run-callbacks-is-the-instance-method-only`)
paired the real body with `run_callbacks`. They are receipted there with
`@missingRailsArgs invoke_before` / `invoke_after — CONVERGEABLE` pointing at this story.

`CallbackSequence` already holds `_callbackChain`, so `chainName` is derivable without an argument. Whether
`opts` can leave the argument list (and where the sync-strict mode then lives) is the open design question.

## Acceptance criteria

- [ ] `runCallbacks` calls `invokeBefore(env)` / `invokeAfter(env)` as `callbacks.rb:108,110,119,134,135` do, and the two `@missingRailsArgs` receipts on `runCallbacks` are deleted.
- [ ] `CallbackSequence#invokeBefore` / `#invokeAfter` take `env` only (`callbacks.rb:719-725`).
- [ ] The sync-strict rejection of an async callback keeps its existing tests green, or the story is blocked with the specific language blocker.
