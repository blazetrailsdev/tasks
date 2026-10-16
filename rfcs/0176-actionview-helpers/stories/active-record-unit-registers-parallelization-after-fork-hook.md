---
title: "active-record-unit-registers-parallelization-after-fork-hook"
status: ready
updated: 2026-10-16
rfc: "0176-actionview-helpers"
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

`vendor/rails/v8.0.2/actionview/test/active_record_unit.rb:135-137` registers
`ActiveSupport::Testing::Parallelization.after_fork_hook { ActiveRecordTestConnector.reconnect }`.
`ActiveSupport::Testing::Parallelization`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/parallelization.rb`)
has no trails port, so `packages/actionview/src/test-helpers/active-record-unit.ts`
(trails#8940) omits the registration; `ActiveRecordTestConnector.reconnect` is
ported and uncalled.

## Acceptance criteria

- `Parallelization.afterForkHook` exists in activesupport's testing tree
  (`testing/parallelization.ts`), matching `parallelization.rb`'s
  `after_fork_hook` / `run_cleanup_hook` registration.
- `active-record-unit.ts` registers `ActiveRecordTestConnector.reconnect` with
  it, as `active_record_unit.rb:135-137`, and its `@missingRailsCall` receipt
  is removed.
