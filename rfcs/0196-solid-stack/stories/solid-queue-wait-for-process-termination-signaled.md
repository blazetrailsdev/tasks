---
title: "solid-queue-wait-for-process-termination-signaled"
status: draft
updated: 2026-11-20
rfc: "0196-solid-stack"
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

`waitForProcessTerminationWithTimeout` (`packages/solid-queue/test/support/processes-test-helper.ts`) has no `signaled:` keyword, so `terminateProcess` drops `signaled: signal` (`vendor/solid_queue/v1.7.2/test/test_helpers/processes_test_helper.rb:65`), and the termsig assertion at `:96-102` is unported. Now that fork mode runs real children (trails#10407), the child's exit signal is observable.

## Acceptance criteria

- `waitForProcessTerminationWithTimeout` takes `signaled` and asserts the termsig as Rails :102 does.
- `terminateProcess` passes `signaled: signal`.
