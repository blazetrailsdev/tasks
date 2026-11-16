---
title: "solid-queue-term-exceeding-timeout-in-flight-flake"
status: draft
updated: 2026-11-16
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

`packages/solid-queue/test/integration/processes-lifecycle.test.ts` "term supervisor exceeding timeout while there are jobs in-flight" flakes with `AssertionError: expected [] to deeply equal [ 'background' ]`:

- <https://github.com/blazetrailsdev/trails/actions/runs/43903903870/job/133427800672> (Active Record PostgreSQL Tests (2))
- <https://github.com/blazetrailsdev/trails/actions/runs/43915688450/job/133469567146> (MariaDB Tests (2))

The trails test mirrored v1.1.3's body: it sleeps `shutdown_timeout + 0.5` after TERM and asserts the background worker is still registered. In-process (async mode) the worker and the supervisor both run `shutdown_timeout`, so the worker can deregister first. #10181 bumped to v1.7.2, whose counterpart `vendor/solid_queue/v1.7.2/test/integration/async_processes_lifecycle_test.rb:139-181` documents that race, drops the mid-shutdown registration assertion, waits for the pause job's `started` result before signalling, and asserts the pause job `ready` after termination.

## Acceptance criteria

- The test body mirrors `async_processes_lifecycle_test.rb:139-181`, with no sleep-as-fix and no skip.
- The test passes reliably on SQLite, PostgreSQL and MariaDB, repeated locally.
