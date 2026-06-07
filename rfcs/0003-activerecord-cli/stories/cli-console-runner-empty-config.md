---
title: "ar console / runner: error on empty config for env"
status: in-progress
updated: 2026-06-07
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-package-scaffold"]
deps-rfc: []
est-loc: 30
priority: 55
pr: 2994
claim: "2026-06-07T14:20:14Z"
assignee: "cli-console-runner-empty-config"
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2736). Still live as of 2026-06-05.
Both `arConsole` (`console.ts:29-30`) and `arRunner` (`runner.ts:39-40`) call
`DatabaseTasks.configsFor(currentEnv())` and only connect `if (configs.length > 0)`
— when the array is **empty** they silently fall through (no connection, no
error): `ar console` drops into a REPL with no DB, `ar runner` runs the script
with no connection. The `db:*` commands instead hard-error in this case — e.g.
`dbPrepare` (`db-tasks.ts:306-309`) logs
`ar: no database configuration found for environment "<env>"` and returns `1`.
Add the same guard to `console`/`runner` for Rails fidelity.

## Acceptance criteria

- [ ] `ar console` errors with a clear message and non-zero exit when
      `configsFor(currentEnv())` is empty, replacing the silent
      `if (configs.length > 0)` skip at `console.ts:29-30` (mirror the `db:*`
      guard at `db-tasks.ts:306-309`).
- [ ] `ar runner` gets the same guard at `runner.ts:39-40`.
- [ ] `console.ts` / `runner.ts` covered by a test (empty-config → error + exit 1).

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
