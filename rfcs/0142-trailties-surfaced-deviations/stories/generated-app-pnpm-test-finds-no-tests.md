---
title: "generated-app-pnpm-test-finds-no-tests"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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

`trails new` writes `"test": "vitest run"` into `package.json` and a
`vite.config.ts` with `root: "app"` (`packages/trailties/src/generators/app-generator.ts:358`).
vitest inherits that root, so `pnpm test` looks under `app/`, never sees
`test/`, and exits 1 with "No test files found". `bin/trails test` does not
exist either ("unknown command 'test'"). Rails' `bin/rails test` is
`Rails::Command::TestCommand` (`vendor/rails/v8.0.2/railties/lib/rails/commands/test/test_command.rb`).

`npx vitest run --root . test` finds and passes the generated tests, so only
the wiring is wrong.

Found re-running the root README quickstart (PR #8195) on `main` at `c19bfc0aee`.

## Acceptance criteria

- [ ] In a fresh `trails new` app, `pnpm test` runs `test/**` and exits 0
      after a scaffold.
- [ ] `bin/trails test` exists, ported from `test_command.rb`. Split into its own story if it is too large.
