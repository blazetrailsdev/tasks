---
title: "solid-queue-fork-supervisor-stalled-worker-tests"
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

`vendor/solid_queue/v1.7.2/test/unit/fork_supervisor_test.rb` has two tests built on `run_stalled_supervisor` (`:240-262`): "replace only the fork that does not finish booting" (`:276`) and "preserve a fork that finishes booting before the timeout" (`:291`). Both fork a `ForkSupervisor`. Its configuration is a `Struct.new(:configured_processes, :mode)`, and each configured process is a `Struct.new(:process_class, :attributes)` whose `instantiate` is `process_class.new(**attributes)`. One of them names the test-defined `ForkSupervisorTest::StalledWorker` (`:4-19`).

trails#10448 parks both as `it.skip` pointing here. They cannot run on the current code because `Supervised#createFork` (`packages/solid-queue/lib/processes/supervised.ts`) serializes `_configuredProcess.kind`, and `processes/fork-entry.ts` rebuilds the instance through `Configuration::Process#instantiate`'s `SolidQueue::#{kind.titleize}`. A struct with `process_class` has no `kind`, and `StalledWorker` is not under `SolidQueue`.

## Acceptance criteria

- The fork payload names the instance's class through `rbModName`, and `fork-entry.ts` resolves it with `constGet`, so any configured process's class is rebuilt in the child.
- `StalledWorker` moves to a test support module that the dummy `config/environment.ts` imports, and is seated where `constGet` finds it.
- `run_stalled_supervisor` and `terminate_stalled_supervisor` are ported in `test/fork-supervisor.test.ts`, and both tests run un-skipped against real forks.
