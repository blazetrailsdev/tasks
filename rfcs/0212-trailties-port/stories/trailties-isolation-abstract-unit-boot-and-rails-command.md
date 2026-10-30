---
title: "Port abstract_unit's boot_rails, rails(*args), Rack and Reload helpers"
status: ready
updated: 2026-10-30
rfc: "0212-trailties-port"
cluster: tt-harness
packages: ["trailties"]
deps: ["trailties-isolation-abstract-unit-generation"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rest of `vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb`: `boot_rails`,
`rails(*args, allow_failure:, stderr:)` (`:345-385`), which forks unless
`NO_FORK`, and `TestHelpers::Rack` (`get`, `app`, `extract_body`) and
`TestHelpers::Reload`.

## Acceptance criteria

- `rails` ports its no-fork arm only: a child process running the app's
  `bin/trails`. The fork arm carries a receipt citing CLAUDE.md § "Runtime
  facts Node does not expose".
- `boot_rails` boots the copied app in the isolated test's own process.
- One ported `test/application/*` file (`application/active_job_railtie_test.rb`, 1 test) passes on the harness
  as a smoke test.
