---
title: "trailties-credentials-edit-interrupted-flake"
status: done
updated: 2026-11-22
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10543
claim: "2026-11-22T03:22:33Z"
assignee: "solid-cable-trim-job-limited-trim-flakes-on-pg"
blocked-by: null
closed-reason: null
---

# trailties credentials "edit … if interrupted" flakes in CI

## Context

`packages/trailties/test/commands/credentials.test.ts` › `Trails::Command::CredentialsTest` › "edit command does not display save confirmation message if interrupted" failed on trails#10506 (run 44925019322, job 136909215359, Trailties Tests shard 1/3, 2503ms). The PR's diff does not touch the credentials command, and the test passes locally on the same branch.

    AssertionError: expected 'Editing config/credentials.yml.enc...' not to match /file encrypted and saved/i

The test sets `VISUAL` to `sh -c 'kill -INT $PPID'`. The edit should be interrupted and print "nothing saved" (`vendor/rails/v8.0.2/railties/test/commands/credentials_test.rb`). In CI the signal sometimes arrives too late, or reaches a different process, so the edit completes and saves.

## Acceptance criteria

- [ ] Find why the INT from the editor subprocess does not interrupt the edit under CI load (signal target, or a race between the editor exiting and the handler).
- [ ] The test passes reliably in CI with its Rails name and assertions unchanged.
