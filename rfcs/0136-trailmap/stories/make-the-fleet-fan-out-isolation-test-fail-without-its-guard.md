---
title: "Make the fleet fan-out isolation test fail without its guard, or drop both"
status: done
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trailmap#92
claim: "2026-10-29T12:51:28Z"
assignee: "loopback-only-guard-as-a-private-method-by-name"
blocked-by: null
closed-reason: null
---

trailmap#82 added a test in `test/lib/fleet-relay.test.ts`, "still sends a frame to every other viewer when one viewer's socket throws", which breaks one viewer's socket write. #83 then rewrote the relay's write path: `flush` catches a failing `writeNonblock` and calls `finish`. So `viewer.frame` can probably no longer throw, and the test likely passes even without the per-viewer try/catch in `subscribe`'s `fanOut` (`lib/fleet-relay.ts`).

- Remove the try/catch and run the test. If it still passes, make the test throw from the viewer itself (for example a `driver.text` that throws), or drop both the guard and the test.

## Acceptance

- The test fails without the `fanOut` guard, or the guard and the test are both gone.
