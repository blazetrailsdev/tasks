---
title: "Regenerate trailmap's bin/jobs from the converged solid_queue binstub template"
status: done
updated: 2026-11-15
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trailmap#143
claim: "2026-11-15T22:21:36Z"
assignee: "solid-cache-size-tests-need-seeded-srand"
blocked-by: null
closed-reason: null
---

# Regenerate trailmap's bin/jobs from the converged solid_queue binstub template

## Context

trails#10112 converged `packages/solid-queue/lib/generators/solid-queue/install/templates/bin/jobs.tt` on the gem's binstub (`vendor/solid_queue/v1.1.3/lib/generators/solid_queue/install/templates/bin/jobs`: boot `config/environment`, require the CLI, `SolidQueue::Cli.start(ARGV)`). trailmap's `bin/jobs` (adopted verbatim in trailmap#137) still has the old body: a `Dir.glob` of `app/jobs/**` and `Cli.start(process.argv.slice(2))`. This was the one acceptance criterion of `solid-queue-bin-jobs-template-mirrors-binstub` left outside that PR, because it lives in the trailmap repo.

## Acceptance criteria

- trailmap's `bin/jobs` is the template's content: `rbArgv()` from ruby-compat, then `import "../config/environment.ts"`, then a dynamic import of `@blazetrails/solid-queue/cli` and `Cli.start(rbArgv())`. No `app/jobs` glob.
- trailmap's `bin/jobs start` still runs a job named in `config/recurring.yml`, with the job class resolved by the Zeitwerk autoloader.
