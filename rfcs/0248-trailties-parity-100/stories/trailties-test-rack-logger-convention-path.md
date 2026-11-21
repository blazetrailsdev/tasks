---
title: "trailties: move rack_logger_test port to its convention path"
status: draft
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test -- --package trailties` reports
`rack/logger.test.ts → rack-logger.test.ts (5 tests)` as misplaced.
`packages/trailties/test/rack/logger.test.ts` holds the port of
`vendor/rails/v8.0.2/railties/test/rack_logger_test.rb`
(`notification`, `notification on raise`, `logger does not mutate app return`,
`logger is flushed after request finished`, `logger pushes tags`).
That Rails file's convention path is `packages/trailties/test/rack-logger.test.ts`, and the row reads 0 OK / 5 Move.

## Acceptance criteria

- [ ] `git mv` the file to `packages/trailties/test/rack-logger.test.ts` and fix its relative imports.
- [ ] Check the describe name against Rails (`RackLoggerTest`).
- [ ] `rack_logger_test.rb` reads 5 OK, 0 Move.
