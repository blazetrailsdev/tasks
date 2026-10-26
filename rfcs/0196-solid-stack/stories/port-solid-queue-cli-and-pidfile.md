---
title: "port-solid-queue-cli-and-pidfile"
status: draft
updated: 2026-10-26
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

`port-solid-queue-supervisor` ported `SolidQueue::Supervisor`, `Configuration`,
`Supervisor::Maintenance` and `Supervisor::Signals`, running supervisees as
threads (RFC 0196 § "Decisions"). Three pieces are left:

- `SolidQueue::Cli` (`vendor/solid_queue/v1.1.3/lib/solid_queue/cli.rb:1-31`),
  a `Thor` subclass whose `start` calls `SolidQueue::Supervisor.start(**options.symbolize_keys)`.
  trails' Thor lives at `packages/trailties/src/thor/thor.ts`, and has no
  package subpath export yet.
- The `bin/jobs` template
  (`vendor/solid_queue/v1.1.3/lib/generators/solid_queue/install/templates/bin/jobs`),
  `SolidQueue::Cli.start(ARGV)` after loading `config/environment`.
- `Supervisor::Pidfiled` and `Supervisor::Pidfile`
  (`lib/solid_queue/supervisor/pidfiled.rb`, `pidfile.rb`). `Pidfile#check_status`
  calls `::Process.kill(0, existing_pid)`, and ruby-compat's `Process`
  (`packages/ruby-compat/src/process.ts`) has no `kill`, so it needs one
  (adapter `kill` plus `Errno::ESRCH` / `EPERM`). `SolidQueue.supervisorPidfile`
  is already seated (`packages/solid-queue/src/solid-queue.ts`).
  `packages/solid-queue/src/supervisor.ts` does not `include(this, Pidfiled)` yet.

## Acceptance criteria

- `Cli` is ported with its three class options, `isExitOnFailure` and its
  default `start` command, and passes the options to `Supervisor.start`.
- The `bin/jobs` template is in the solid_queue install generator's templates.
- `Pidfiled` / `Pidfile` are ported over async fs, and `Supervisor` includes
  `Pidfiled`.
- `supervisor_test.rb`'s "create and delete pidfile", "abort if there's
  already a pidfile for a supervisor" and "delete previous pidfile if the
  owner is dead" are ported under those names.
