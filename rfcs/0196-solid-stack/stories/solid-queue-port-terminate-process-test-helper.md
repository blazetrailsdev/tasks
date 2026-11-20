---
title: "solid-queue-port-terminate-process-test-helper"
status: closed
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
closed-reason: "FALSIFIED: shipped in trails#10427 at reviewer request"
---

## Context

`packages/solid-queue/test/support/processes-test-helper.ts` has no port of `terminate_process(pid, timeout: 10, signal: :TERM)` (`vendor/solid_queue/*/test/test_helpers/processes_test_helper.rb:63-66`). So `concurrency-controls.test.ts` "don't block claimed executions that get released" (Rails `test/integration/concurrency_controls_test.rb:179-191`) runs `sleep(0.1).then(() => run.terminate())` plus `sleep(shutdownTimeout + 0.6)` where Rails calls `terminate_process(@pid)`. It also passes `pause: shutdownTimeout + 10` where Rails passes `+ 30.seconds`.

## Acceptance criteria

- Port `terminateProcess` at its Rails name (signal, then `waitForProcessTerminationWithTimeout`).
- The test body mirrors Rails line for line: `+ 30` pause, `terminateProcess(run)`, and no ad-hoc sleeps.
