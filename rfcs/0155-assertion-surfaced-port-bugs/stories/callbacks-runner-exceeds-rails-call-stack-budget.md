---
title: "callbacks-runner-exceeds-rails-call-stack-budget"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8046
claim: "2026-09-24T18:14:09Z"
assignee: "attribute-assignment-argument-error-names-js-number-not-integer"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-cache-xml-json-callbacks` (RFC 0132).
Parked tests: `packages/activesupport/src/callbacks.test.ts` › `CallStackTest`
› `tidy call stack` and `short call stack`.

Rails (`vendor/rails/activesupport/test/cases/callbacks_test.rb:452-537`)
asserts a call-stack budget: an exception raised inside `run_callbacks`'s block
shows one frame for `run_callbacks`, plus N+1 frames for N invoked `:around`
callbacks (`tidy`), and just `block in save` / `run_callbacks` / `save` with no
arounds (`short`).

trails' `CallbackSequence` (`packages/activesupport/src/callbacks.ts`) runs each
around through `runSeq` / `afterBefore` / `runAround` / `invokeAround` / `next`,
and the block through `runFinal`, so the raised error's stack carries ~5 frames
per around and V8's default 10-frame limit truncates before reaching `save`.
The message assertion (`inside save`) already passes; the label assertion does
not.

## Acceptance criteria

- The callback runner's frame budget matches Rails': one frame for the block
  entry, one per invoked around plus one, one for `runCallbacks`.
- Un-skip both tests; they pass unchanged.
