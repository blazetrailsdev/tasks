---
title: "sessions-files pane tail test times out at 5s under the full parallel suite"
status: in-progress
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trailmap#96
claim: "2026-10-30T00:53:46Z"
assignee: "bound-the-transcript-parse-on-the-request-thread"
blocked-by: null
closed-reason: null
---

## Context

`test/controllers/sessions-files.test.ts`, "replays only the tail of a log past the bound", timed out at vitest's default 5 s in three consecutive full `pnpm test` runs while trailmap#93 was open. Run alone it takes about 1.1 s and passed on two of three runs; it was green in CI. It replays 2.5 MiB through `core.wasm` synchronously (about 110 ms/MB, per `lib/ringo-core.ts`), so under parallel workers on a loaded box it overruns.

## Acceptance criteria

- The test is stable under a full parallel `pnpm test`: give it an explicit timeout with a comment saying why, or make the log smaller while it still exceeds `PANE_VIEW_MAX_BYTES`.
- No change to what it asserts.
