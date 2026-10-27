---
title: "twin-diff's end-to-end test runs in the rails CI job once the twin is on main"
status: in-progress
updated: 2026-10-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trailmap#86
claim: "2026-10-27T16:44:53Z"
assignee: "twin-diff-end-to-end-test-runs-in-the-rails-ci-job"
blocked-by: null
closed-reason: null
---

## Context

trailmap#84 added `scripts/twin-diff/` and its test `test/scripts/twin-diff.test.ts`. The end-to-end case ("runs end to end over rails/ and app/") needs Ruby with Prism (3.3+) and a Rails twin at `rails/app` (or `TWIN_DIFF_RAILS`). Today CI's `pnpm test` job has neither, so the case is skipped there and only runs locally.

The twin itself lands from `feat/rails-port`, in its own PR (opened from a spawned agent after trailmap#84's review). That branch adds a `rails` CI job which installs Ruby (`ruby/setup-ruby@v1` in `.github/workflows/ci.yml`).

## Acceptance criteria

- Once `rails/` is on main, the `rails` CI job (or a step beside it with Ruby 3.3+) runs `npx vitest run test/scripts/twin-diff.test.ts`, and the end-to-end case executes rather than skips. Check that the job log does not report it as skipped.
- The test no longer needs `TWIN_DIFF_RAILS` on main, because `rails/app` is present.
