---
title: "Trails boot enables source maps so precompiled template frames name the .tse line"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 9
pr: trails#9196
claim: "2026-10-21T21:15:05Z"
assignee: "build-views-precompiles-every-registered-handler"
blocked-by: null
closed-reason: null
---

## Context

Rails names a template's own line in a backtrace because `compile` passes `identifier` and `offset` to `module_eval` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:500-502`), and `TemplateError#line_number` reads it with `/#{File.basename(file_name)}:(\d+)/` (`template/error.rb:223-229`). After trails#9149, the emitted module's source map chains back to the `.tse` file, but Node applies it only with `--enable-source-maps` (or `module.setSourceMapsSupport`). Without that, frames name `<template>.js:<line>`, `TemplateError#lineNumber` returns null, and `ExceptionWrapper` shows no template source extract. The CLAUDE.md section "Templates are precompiled (`Template#compile`'s `module_eval`)" notes the requirement, but nothing enables it.

## Acceptance criteria

- The trails application boot path (the `trails server` command / `Trails.application` initialisation in trailties) turns on Node's source-map support before any template module loads, using the public `node:module` API through the runtime adapter rather than a `process.*` reference in shipped code.
- A plain-node (not vitest) test renders a failing precompiled template through the boot path and asserts that `TemplateError#lineNumber()` is the `.tse` line.
