---
title: "solid-queue-forked-lifecycle-worker-registration-flake-mariadb"
status: ready
updated: 2026-11-24
rfc: "0061-ci-failures"
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

`packages/solid-queue/test/integration/forked-processes-lifecycle.test.ts`
failed on MariaDB shard 3/3 (run 44936108821, job 136943075369, PR trails#10503,
a tooling-only diff). Assertion:
`expected [ 'default' ] to deeply equal [ 'background', 'default' ]` from
`assertRegisteredWorkersFor` (`:93`), called from setup at `:145` — the
supervisor's `background` worker had not registered yet when the check ran.
The same log shows `Mysql2::Error: Deadlock found when trying to get lock`.
The Rails counterpart waits for registration
(`vendor/solid_queue/.../test/integration/forked_processes_lifecycle_test.rb`
setup, `wait_for_registered_processes`).

## Acceptance criteria

- [ ] Setup waits for every configured worker to register (as Rails'
      `wait_for_registered_processes` does) before `assertRegisteredWorkersFor`,
      or the deadlock on MariaDB that delays registration is fixed.
- [ ] The file passes repeatedly on the MariaDB lane.
