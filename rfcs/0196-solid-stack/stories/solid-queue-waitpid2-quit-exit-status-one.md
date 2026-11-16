---
title: "solid-queue-waitpid2-quit-exit-status-one"
status: claimed
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-16T00:51:34Z"
assignee: "local-cache-middleware-requires-rack-at-call-time"
blocked-by: null
closed-reason: null
---

# Supervisor#waitpid2 reports a QUIT supervisee as exit! status 1

## Context

Ruby's supervisee answers QUIT with `exit!`
(`vendor/solid_queue/v1.1.3/lib/solid_queue/processes/supervised.rb:35-36`), so
`Process.waitpid2` reports exit status 1 and `Supervisor#reap_terminated_forks`
(`vendor/solid_queue/v1.1.3/lib/solid_queue/supervisor.rb`) fails its claimed
jobs through `handle_claimed_jobs_by`. trails' `Supervisor#waitpid2`
(`packages/solid-queue/lib/supervisor.ts`) answers `exitstatus: 0` whenever
`instance.isStopped()`, so a supervisee stopped by TERM and then QUIT on
shutdown timeout is reaped as a clean exit. ruby-compat's `Thread` cannot tell a
killed thread from one whose body finished (`packages/ruby-compat/lib/thread.ts`,
`Thread#exit`). The polling half (a killed thread stops in `Queue#pop`) landed
with solid-queue-quit-supervisee-exits-like-exit-bang.

## Acceptance criteria

- `waitpid2` reports a supervisee killed by QUIT as exited with status 1, so
  `reapTerminatedForks` calls `handleClaimedJobsBy` for it.
- A test that fails before the change covers the TERM-then-QUIT reap.
