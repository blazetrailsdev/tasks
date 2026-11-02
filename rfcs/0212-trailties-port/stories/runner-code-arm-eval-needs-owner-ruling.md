---
title: "runner-code-arm-eval-needs-owner-ruling"
status: ready
updated: 2026-11-02
rfc: "0212-trailties-port"
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

`Rails::Command::RunnerCommand#perform` evals its code argument at `TOPLEVEL_BINDING`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/runner/runner_command.rb:37,48`).
`packages/trailties/src/commands/runner.ts` `evalToplevel` uses a sloppy AsyncFunction
under `with (TopLevel)`. Root CLAUDE.md § "Templates are precompiled" rules out an eval
pipeline for templates; no section rules on `runner`. `__LINE__` is not carried.

## Acceptance criteria

- The repo owner rules on how `runner` evaluates a code string.
- `evalToplevel` converges on that ruling and its receipt is updated or removed.
