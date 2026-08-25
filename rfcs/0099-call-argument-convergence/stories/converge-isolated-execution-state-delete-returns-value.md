---
title: "IsolatedExecutionState.delete returns the deleted value, not a boolean"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6532
claim: "2026-08-14T17:22:10Z"
assignee: "converge-isolated-execution-state-delete-returns-value"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `ActiveSupport::IsolatedExecutionState.delete` is
`state.delete(key)` — `Hash#delete`, which returns the **deleted value**
(`vendor/rails/activesupport/lib/active_support/isolated_execution_state.rb:47-49`).

trails' port at `packages/activesupport/src/isolated-execution-state.ts:56-58`
returns `store().delete(key)` — a JS `Map#delete`, i.e. a **boolean**. The
return value is silently different, and any ported Rails body that reads it has
to work around the gap.

`ExecutionWrapper.runBang`'s `reset:` arm (merged in PR #6529,
`packages/activesupport/src/execution-wrapper.ts`) is the first such body. Rails
is one call:

```ruby
lost_instance = IsolatedExecutionState.delete(active_key)
lost_instance&.complete!
```

trails has to read before deleting:

```ts
const lostInstance = IsolatedExecutionState.get<CompletableExecution>(this.activeKey());
IsolatedExecutionState.delete(this.activeKey());
lostInstance?.completeBang();
```

The deviation is documented in that method's JSDoc, and it doubles the
`activeKey()` calls as a side effect.

## Acceptance criteria

1. `IsolatedExecutionState.delete(key)` returns the deleted value (or
   `undefined` when absent), mirroring `Hash#delete` per
   `isolated_execution_state.rb:47-49`.
2. `ExecutionWrapper.runBang`'s `reset:` arm collapses to Rails' single
   `delete` + `lostInstance?.completeBang()`, and the JSDoc paragraph
   documenting the deviation is removed.
3. Every other `IsolatedExecutionState.delete` call site is checked for
   reliance on the boolean return and updated if it relied on it.
4. `isolated-execution-state.test.ts` covers the returned value for both the
   present and absent key; `executor.test.ts` stays green.
