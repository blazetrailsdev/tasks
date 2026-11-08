---
title: "trailties-port-application-initializers-frameworks-tests"
status: in-progress
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9851
claim: "2026-11-07T23:15:20Z"
assignee: "trailties-port-application-initializers-frameworks-tests"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/initializers/frameworks_test.rb` (447 lines, 30
tests). trails ports one test, "can boot with an unhealthy database"
(`packages/trailties/src/application/initializers/frameworks.test.ts`). The pilot
(trailties-port-application-initializers-tests) measured these costs: one isolated test is
~24-26s wall-clock (a child `vitest run` per test via `registerSpecType` + `Isolation`), and
one ported Rails test is ~12-15 LOC. Ported tests follow `hooks.test.ts` / `load-path.test.ts`:
`registerSpecType(/^XTest$/, XTest)`, `beforeEach` buildApp + rm `config/environments`,
`await import(<appPath>/config/environment.ts)` for Rails' `require "#{app_path}/config/environment"`.

## Acceptance criteria

- Port the remaining frameworks_test.rb tests onto the harness, with names verbatim, as many
  as fit the ceiling. The AC/AM, AD, AS and AR sections are each a natural split.
- A test blocked on an unported surface (ActionMailer, `use_frameworks`, schema cache dump)
  is `it.skip` with `// BLOCKED: <story>`, and that story is filed.
