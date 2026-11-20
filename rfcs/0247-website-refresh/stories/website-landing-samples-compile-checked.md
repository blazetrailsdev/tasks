---
title: "Compile-check the landing page code samples and their shown diagnostics"
status: draft
updated: 2026-11-20
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/website/src/routes/+page.server.ts` holds the landing page's code samples:
the four feature blocks (`blocks`: `app/models/project.ts`, `app/controllers/tasks-controller.ts`,
`app/views/tasks/index.html.tse`, `config/routes.ts`) and the "Caught by the compiler" tab
(`check`, `view`). Their two diagnostics, `checkError` (TS2322) and `viewError`
(TS2551 at `show.html.tse(3,20)`), and the squiggle columns passed to `withError`, are
hand-written. trails#10423 fixed a squiggle that was off by one and a routes sample that
lacked the `new` action its view linked to. Nothing checks the samples against the real
packages, so a sample can drift from the API or fail to compile.

## Acceptance criteria

- A test (website vitest, or a script CI runs) writes the samples into a scratch trails
  app and compiles them with `trails-tsc`, including the `.tse` view through its plugin
  (see `packages/trails-tsc/test/build-views.test.ts` for the scratch-app pattern).
- The feature-block samples compile cleanly.
- The two "caught" samples produce exactly the diagnostics the page shows (code, message,
  line and column), so `checkError`, `viewError` and the `withError` columns are either
  asserted or generated from the compiler output.
