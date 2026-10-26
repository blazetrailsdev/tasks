---
title: "Port SolidQueue Supervisor::Pidfiled and Pidfile (needs Process.kill)"
status: done
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9334
claim: "2026-10-26T15:57:28Z"
assignee: "port-solid-queue-cli-and-pidfile"
blocked-by: null
closed-reason: null
---

## Context

`port-solid-queue-supervisor` ported `SolidQueue::Supervisor`, `Configuration`,
`Supervisor::Maintenance` and `Supervisor::Signals`, running supervisees as
threads (RFC 0196 § "Decisions"), and `SolidQueue::Cli`. The `bin/jobs`
template is `solid-queue-install-generator`'s. Left here:

- `Supervisor::Pidfiled` and `Supervisor::Pidfile`
  (`lib/solid_queue/supervisor/pidfiled.rb`, `pidfile.rb`). `Pidfile#check_status`
  calls `::Process.kill(0, existing_pid)`, and ruby-compat's `Process`
  (`packages/ruby-compat/src/process.ts`) has no `kill`, so it needs one
  (adapter `kill` plus `Errno::ESRCH` / `EPERM`). `SolidQueue.supervisorPidfile`
  is already seated (`packages/solid-queue/src/solid-queue.ts`).
  `packages/solid-queue/src/supervisor.ts` does not `include(this, Pidfiled)` yet.

## Acceptance criteria

- `Pidfiled` / `Pidfile` are ported over async fs, and `Supervisor` includes
  `Pidfiled`.
- `supervisor_test.rb`'s "create and delete pidfile", "abort if there's
  already a pidfile for a supervisor" and "delete previous pidfile if the
  owner is dead" are ported under those names.
