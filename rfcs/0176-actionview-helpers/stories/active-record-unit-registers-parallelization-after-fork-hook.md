---
title: "active-record-unit-registers-parallelization-after-fork-hook"
status: closed
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9002
claim: "2026-10-17T11:34:30Z"
assignee: "actionview-url-and-sanitize-helper-concerns-and-sanitizer-memos"
blocked-by: null
closed-reason: "PERMANENT: scripts/parity/conventions.ts SKIP_GROUPS ratifies after_fork_hook/after_fork_hooks as not mirrored (testing/parallelization.rb; vitest owns worker parallelism, no trails object for fork hooks). active-record-unit.ts's @missingRailsCall after_fork_hook receipt is now PERMANENT (trails#9002)."
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
