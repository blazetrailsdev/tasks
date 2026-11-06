---
title: "thread-local-block-stacks-sibling-async-gap"
status: draft
updated: 2026-11-06
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IsolatedExecutionState` (`packages/activesupport/src/isolated-execution-state.ts`) keys on
ruby-compat's `Thread.current()`, and one `Thread` holds many in-flight promises, so a
thread-local stack a block pushes and pops interleaves between sibling async blocks.
`Encryption::Contexts` now forks its key per block through `IsolatedExecutionState.fork`.
The same gap remains in:

- `ActiveRecord::NoTouching` (`packages/activerecord/src/no-touching.ts:10`,
  `vendor/rails/v8.0.2/activerecord/lib/active_record/no_touching.rb:22-37`, `apply_to` push/ensure pop);
- `ActiveRecord::Suppressor` registry (`vendor/rails/v8.0.2/activerecord/lib/active_record/suppressor.rb:33-41`);
- `ScopeRegistry` (`packages/activerecord/src/scoping.ts:22`, `scoping.rb` `ScopeRegistry`);
- `ExplainRegistry` (`packages/activerecord/src/explain-registry.ts:50`).

## Acceptance criteria

- [ ] Each block-scoped write above runs its block under `IsolatedExecutionState.fork`
      for its key (or the mechanism `isolated-execution-state-fork-needs-owner-ruling` settles on).
- [ ] A sibling-async-blocks test per stack, as in `encryption/contexts.trails.test.ts`.
