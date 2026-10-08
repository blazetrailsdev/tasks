---
title: "Pane-log replay test fails once under a loaded full run"
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test/lib/ringo-core.test.ts`, "renderPaneLog > replays a multi-megabyte
inline-repaint log down to its final rows", failed once in a full local
`pnpm test` run on trailmap#44 (1 failed, 526 passed) and passed 10/10 when the
file was run on its own, and passed in CI. The change under test (a trails pin
bump and a deleted controller override) does not touch `lib/ringo-core` or the
WASI module. Replay is synchronous and costs about 110 ms/MB, so under a loaded
machine the test is the likeliest in the suite to cross a time limit.

The failure message was not captured; the first step is to reproduce it.

## Acceptance criteria

- Reproduce under load (the full suite in parallel, or with CPU contention) and
  record whether it is the test timeout or an assertion.
- If it is the timeout: give the test a limit that fits the work it does, or
  shrink the fixture to the smallest log that still proves the property, and
  say which in the PR.
- If it is an assertion: it is a real ordering or state bug in the replay and
  is fixed, not retried.
- No retry wrapper is added to make it pass.
