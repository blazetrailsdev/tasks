---
title: "trailties-test-console-and-dbconsole-pty"
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

`vendor/rails/v8.0.2/railties/test/application/console_test.rb` (18 tests still
Miss: sandbox, sandbox_by_default, prompt / irb_name, environment option,
dev/test/prod prompts, app routes loaded, reload! callbacks and constants,
user prompt mode, USE_AUTOCOMPLETE) and
`vendor/rails/v8.0.2/railties/test/application/dbconsole_test.rb` (2 tests)
spawn `bin/rails console` / `dbconsole` on a PTY against a built app.
`packages/trailties/test/application/console.test.ts` today ports only the four
helper tests in-process over a mocked `Trails.application` and a REPL adapter
(`lib/commands/console/tsrepl-console.ts`). The remaining tests need a real
booted app (`buildApp`) driving the console: sandbox rollback through
ActiveRecord's console sandbox, `TSREPL.conf` prompt/name/autocomplete, and
`reloadBang`.

## Acceptance criteria

- [ ] Every test in both Rails files is matched in `pnpm parity:test -- --package trailties`.
- [ ] Lib gaps the tests reveal are fixed in `packages/trailties/lib`; no `it.skip` without a `PERMANENT-SKIP:` naming a CLAUDE.md section.
