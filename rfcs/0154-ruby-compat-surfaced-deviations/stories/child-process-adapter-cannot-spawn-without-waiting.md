---
title: "ChildProcessAdapter cannot start a child without waiting for it: no Process.spawn / kill / wait"
status: draft
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap#64. `ChildProcessAdapter`
(`packages/ruby-compat/src/child-process-adapter.ts:37-57`) offers `spawnSync`,
`system` and `capture2e`. All three run a child to completion. There is no way
to START a long-lived child and keep a handle to it — Ruby's
`Process.spawn` → pid, then `Process.kill` / `Process.wait`
(`process.c`), which is what `system` and `capture2e` are built from.

trailmap's dashboard end-to-end harness needs exactly that: boot the app and
a headless Chrome, drive them, then stop both. A script may not import
`node:child_process`, so the orchestration had to move into a shell wrapper
(`scripts/dashboard-e2e.sh`, `setsid … &` and a `trap` that kills the process
group) around the TypeScript that does the actual work.

## Expected shape

Something like `spawn(cmd, args, { env, out, err, pgroup })` returning a pid,
with `kill(signal, pid)` and `wait(pid)` beside it, on the adapter.

## Acceptance criteria

- [ ] The adapter can start a child without waiting for it, signal it (and
      its process group), and wait for it, with tests in ruby-compat.
- [ ] trailmap's `scripts/dashboard-e2e.sh` folds into `dashboard-e2e.ts`
      once re-vendored, or the story says why the wrapper stays.
