---
title: "build-templates-atomic-write"
status: draft
updated: 2026-11-08
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

`buildTemplates` (`packages/trails-tsc/lib/build-templates.ts:15`) writes each `<template>.js` in place with `getFs().writeFile`. Any reader that `import()`s the file during that write (`CapturableERB#result`, `packages/ruby-compat/lib/tse.ts:62-76`) can see a truncated module with no default export. trails#9881 removed the concurrent writer that caused the Trailties Tests flake: isolation children were re-running the template global setup. The write itself is still non-atomic.

## Acceptance criteria

- `buildTemplates` writes each compiled template to a temporary sibling, then renames it over `<template>.js`, so a reader sees either the old file or the complete new one.
- Async fs only. No `node:*` imports.
- The existing `packages/trails-tsc/test/build-templates.test.ts` still passes.
