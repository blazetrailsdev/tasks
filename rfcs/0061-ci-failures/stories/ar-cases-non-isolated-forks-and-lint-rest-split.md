---
title: "CI: run Active Record cases in non-isolated forks and split Lint (rest)"
status: done
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#10765
claim: "2026-11-26T01:02:21Z"
assignee: "ar-cases-non-isolated-forks-and-lint-rest-split"
blocked-by: null
closed-reason: null
---

## Context

The CI critical path is the Active Record adapter lanes and `Lint (rest)`. Measured on four `main` runs (45613724990, 45636523125, 45655495369, 45658263522): SQLite job wall 545-739s, sharded test step 378-608s; `Lint (rest)` 580-699s.

**Per-file forks.** On SQLite shard 1 vitest's summed phases are setup 804s (57%), tests 381s, collect 189s. Each test file runs in a fresh fork (`pool: "forks"`, `isolate` default) and pays about 2.6s of module-graph evaluation in `setupFiles` (`vitest.config.ts`, the `activerecord` project). `packages/activerecord/test/cases` is 836 of the lane's 1,065 files and about 72% of its fork time.

Non-isolated forks are sized from the root `poolOptions.forks.isolate` only (vitest 3 `createForksPool`), and the engine dummy apps in solid-queue, actionmailbox and actiontext do not survive sharing a fork, so only the AR cases can run that way and they need their own invocation.

Vitest re-evaluates `setupFiles` for every file in a shared fork, as a second module instance. `packages/activerecord/test/support/test-setup-dy.ts` purges and re-lays the schema on evaluation, `packages/activerecord/test/cases/helper.ts` keeps the writing-pool baseline in a module variable, and `packages/activesupport/lib/testing/autorun.ts` keeps its `described` / `executions` / `capturing` / `captured` registries and `fileClass` in module variables that every other importer reads from the first instance.

**Lint.** `Lint (rest)` runs one ESLint process over 56 packages (`.github/workflows/ci.yml`, the `lint` job's matrix). Locally it peaks at 11.0 GB against `--max-old-space-size=10240` and takes 1423s; the largest third of the same packages on its own takes 135s at 6.1 GB. `--concurrency 3` takes 32 GB and does not fit a hosted runner.

## Acceptance criteria

- `packages/activerecord/test/cases` runs in non-isolated forks on the SQLite, PostgreSQL and MariaDB lanes; every other package in those lanes stays isolated.
- A file that fails non-isolated is re-run in isolated forks and the step fails only if it fails there, so a state leak between files cannot red the lane.
- The two halves cover exactly the file set the single step covered.
- With no new environment variable set, `vitest.config.ts` resolves to the configuration it had, so local runs and scoped PR runs are unchanged.
- `Lint (rest)` is split so no leg exceeds the heap cap; a package added later is linted without editing the matrix; on PRs one leg still lints the changed files alone.
- The PR records before and after job times from its own CI runs.
