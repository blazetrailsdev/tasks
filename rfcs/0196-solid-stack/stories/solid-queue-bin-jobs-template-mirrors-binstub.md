---
title: "solid_queue:install's bin/jobs mirrors the gem's binstub (no app/jobs glob, ARGV via rbArgv)"
status: draft
updated: 2026-11-12
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# solid_queue:install's bin/jobs mirrors the gem's binstub

## Context

The gem's binstub (`vendor/solid_queue/v1.1.3/lib/generators/solid_queue/install/templates/bin/jobs`) is three lines:
`require_relative "../config/environment"`, `require "solid_queue/cli"`,
`SolidQueue::Cli.start(ARGV)`.

trails' template (`packages/solid-queue/lib/generators/solid-queue/install/templates/bin/jobs.tt`) diverges twice:

- `:5` eager-imports every file under `app/jobs/**` through `Dir.glob`. Rails has no such step: the application's Zeitwerk loader (packages/trailties/CLAUDE.md § "The application loader is Zeitwerk") resolves a job class by name when a queued job or `config/recurring.yml` names it. trailmap ran `bin/jobs` without the glob and resolved its jobs through the autoloader, so this step is invented surface. If the autoloader cannot do this in some app shape, that is the gap to fix.
- `:8` passes `process.argv.slice(2)` where Ruby passes `ARGV`. The trails spelling of `ARGV` is ruby-compat's `rbArgv()` (trailmap's former `lib/jobs.ts` used it).

trailmap adopted this template verbatim in trailmap#137, so its `bin/jobs` carries both.

## Acceptance criteria

- `bin/jobs.tt` is the three Rails lines: boot `config/environment`, import the CLI, `Cli.start(rbArgv())`.
- The install generator test asserts the new content, and a generated app's `bin/jobs start` still runs a job named in `config/recurring.yml`.
- trailmap's `bin/jobs` is regenerated from the new template.
