---
title: "The dashboard DOM tests wait a fixed 50ms for a POST, and time out under full-suite load"
status: ready
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test/assets/dashboard-dom.test.ts:170` ("spawns on ⌘↵ the way the loop does…") presses ⌘↵, then
`await settle(50)`, then asserts the POST landed and the dialog closed. In a full
`pnpm test` run during trailmap#169 it failed once: the stubbed fetch and the outcome had not
both run within 50ms under load. `test/assets` alone passed 3 of 3. The broadcast
CI-red test that #169 added uses the same `settle(50)` pattern.

## Acceptance criteria

- The DOM tests wait on the condition (the post recorded and the dialog closed), polled up to a
  generous bound, instead of a fixed 50ms sleep. This covers the spawn test and the broadcast
  CI-red test.
- `pnpm test` passes 5 runs in a row on the dev box with nothing else changed.
