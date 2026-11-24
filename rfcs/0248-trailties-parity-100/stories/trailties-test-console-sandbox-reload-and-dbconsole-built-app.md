---
title: "trailties-test-console-sandbox-reload-and-dbconsole-built-app"
status: draft
updated: 2026-11-24
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

Split from `trailties-test-console-irb-and-dbconsole-remainder`, which ported the
fifteen console tests the fake-app REPL harness in
`packages/trailties/test/application/console.test.ts` can reach (prompt,
colorize, rc file, sandbox-by-default, reload callbacks). Still Miss:

- `vendor/rails/v8.0.5.2/railties/test/application/console_test.rb:49`
  `test_sandbox`: needs a real AR connection and a `posts` table in a built
  app (`test/support/isolation/abstract-unit.ts` `buildApp`), with the console
  started from it so `trailties/console-sandbox`
  (`packages/trailties/lib/trailties/active-record.ts:193`) wraps the session.
- `console_test.rb:215` `test_reload_command_reload_constants`: needs the
  built app's Zeitwerk loader to reload `app/models/user.ts` after `reloadBang()`.
- `vendor/rails/v8.0.5.2/railties/test/application/dbconsole_test.rb:21` and
  `:44`, into `packages/trailties/test/application/dbconsole.test.ts`: spawn
  `trails dbconsole` against the built app and read `sqlite>` from the real
  sqlite3 binary. Node has no PTY, so sqlite3 prints no prompt on a pipe;
  decide whether `-interactive` (a receipted arg) or a PTY-less arm is the port.

## Acceptance criteria

- [ ] The four tests above are matched in `pnpm parity:test -- --package trailties`.
- [ ] No `it.skip` without a `PERMANENT-SKIP:` line citing a CLAUDE.md section.
