---
title: "Flaky: InitializersTest environment-option test boots a non-development env in CI"
status: draft
updated: 2026-11-28
rfc: "0061-ci-failures"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Problem

`packages/trailties/test/commands/initializers.test.ts` > "prints out initializers only specified in environment option" fails intermittently in CI. The test runs `bin/trails initializers` with no `-e` and expects the development-only initializer. The CI run printed 173 initializers without it, so the command booted an environment other than `development`.

Seen on trails#10862 in run 46106263327, job 140859683641 (Trailties Tests (6), `--shard=6/6`). Rerunning the job passed, and the test passes three times out of three when run alone locally.

## Suspected cause

`TRAILS_ENV`, or a `Trails.env` assignment, leaks from another test in the same shard or fork. Many trailties tests `setEnv("TRAILS_ENV", ...)` and restore it themselves, for example the `boot-app-*.trails.test.ts` files, `engine.test.ts`, `application.test.ts` and `application/server.test.ts`. The command's subprocess inherits the parent's environment.

## Acceptance

- Find the leaking test, for example by running shard 6/6 with a guard that asserts `TRAILS_ENV` and `RACK_ENV` are unchanged after each file, and make it restore the environment.
- Or have `Isolation#trails` spawn with a clean `TRAILS_ENV` and `RACK_ENV`, as Rails' isolation `rails(...)` runs in a fresh process with the app's own environment.
