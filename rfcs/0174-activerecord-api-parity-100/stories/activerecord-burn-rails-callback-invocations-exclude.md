---
title: "activerecord: the 5 methods exempted from rails-callback-invocations fire Rails' callbacks"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: errors
packages: ["activerecord"]
deps: ["converge-activerecord-dropped-block-arms-remainder"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`eslint/rails-callback-invocations-exclude.json` grandfathers five activerecord methods whose Rails
counterpart runs callbacks the port does not: `callbacks.ts#createOrUpdate` (`_run_save_callbacks`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/callbacks.rb`), `core.ts#initWithAttributes` (`_run_find_callbacks` / `_run_initialize_callbacks`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:508` — see also `converge-activerecord-dropped-block-arms-remainder`),
`transactions.ts#beforeCommittedBang` / `#committedBang` / `#rolledbackBang` (`_run_before_commit_callbacks`,
`_run_commit_callbacks`, `_run_rollback_callbacks`, `vendor/rails/v8.0.2/activerecord/lib/active_record/transactions.rb`).

## Acceptance criteria

- [ ] Each fires the callback chain Rails fires, through `runCallbacks("<event>")`, and leaves the exclude list.
- [ ] `eslint/rails-callback-invocations-exclude.json` is empty and deleted with its registration.

## Verification

```bash
pnpm lint
```
