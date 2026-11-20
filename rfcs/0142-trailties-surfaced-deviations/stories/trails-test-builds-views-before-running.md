---
title: "trails test runs build-views so newly generated templates load"
status: draft
updated: 2026-11-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In a generated app, `bin/trails generate mailer BaseMailer welcome` followed by `bin/trails test` fails with `cannot load such file -- <app>/.trails/views/base-mailer/welcome.html.tse.js`. The test is `railties/test/application/integration_test_case_test.rb:17-45`. Templates load from the `build-views` output (packages/actionview/CLAUDE.md, "Templates are precompiled"), and nothing builds a template written after the last build before the test run.

Rails compiles templates at first render, so its `rails test` needs no build step. In trails the converged shape is for `test:prepare` (or the `trails test` path that `Runner` takes, `packages/trailties/lib/test-unit/runner.ts`) to run `build-views` before Vitest starts, in the same way `trails server` does in development.

## Acceptance criteria

- [ ] `bin/trails test` in a generated app renders a template generated after the last build.
- [ ] `IntegrationTestCaseTest` "resets Action Mailer test deliveries" can be ported unchanged.
