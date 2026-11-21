---
title: "devcontainer-system-test-env-and-path-converge"
status: draft
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
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

`DevcontainerGenerator#containerEnv` and `systemTestConfiguration`
(`packages/trailties/lib/generators/trails/devcontainer/devcontainer-generator.ts`)
write `TRAILS_SYSTEM_TESTING_SERVER_PORT`, where Rails writes
`CAPYBARA_SERVER_PORT` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb`,
`container_env` and `system_test_configuration`). The `rails` → `trails` token
rename does not cover `CAPYBARA`, and trails system testing runs on Vitest and
Playwright (root CLAUDE.md § "System testing runs on Vitest"), so the right
name has to be decided, not guessed. The same file also checks for
`test/application_system_test_case.ts`, while the app generator writes
`test/application-system-test-case.ts`.

## Acceptance criteria

- [ ] The env var name follows Rails, or the SystemTesting port's own reader, and the choice cites that reader.
- [ ] The generator and `trails devcontainer` find the system test case file the app generator writes.
- [ ] `devcontainer-generator.test.ts` "system test option default" asserts the converged names.
