---
title: "pnpm test fails on uncompiled view fixtures unless pnpm views ran first"
status: draft
updated: 2026-11-16
rfc: "0136-trailmap"
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

## Context

`pnpm test` in a fresh worktree fails `test/helpers/app-helpers-in-views.test.ts` ("reaches a template without the controller naming the helper") with `LoadError: cannot load such file -- test/fixtures/views/helper-probes/show.html.tse.js`. The compiled fixture only exists after `pnpm views`, and that needs both database variables. This surfaced on trailmap#146, where every run reported one unrelated failure.

## Acceptance criteria

- Either `pnpm test` compiles the test-fixture views it needs, or the test skips with an explicit "run pnpm views" message when the build is missing.
- A fresh worktree runs `pnpm test` with no failures caused by a stale or missing view build.
