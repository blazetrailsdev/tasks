---
title: "Generated bin/trails exits after a command returns (db:migrate hangs on Postgres)"
status: draft
updated: 2026-11-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Problem

Since trails#10754 ("commands exit on return"), `RakeCommand.perform` no longer
calls `disconnectAllBang`, and the process exit lives only in
`packages/trailties/lib/bin.ts` (the `trails` executable). A generated app's
`bin/trails` (`bin/trails.tt`) does not go through `bin.ts`: it imports
`@blazetrails/trailties/commands`, and `lib/commands.ts` ends after `invoke`
without exiting. So any app whose database is Postgres hangs forever after
`bin/trails db:migrate` (or any rake task that opened a pool): the pg socket keeps
the event loop alive.

Found by trailmap#213 (first install from npm, 0.1.0-alpha0.2): the image smoke
runs the release command `bin/trails db:migrate`, which migrates the hub
Postgres and then never exits; CI cancels the job at 15 minutes. Active handles
after the migration: one `Socket` to :5432.

## Fix

`commands.ts` ends the process once `invoke` returns, as `bin.ts` does
(Ruby's interpreter exits at the end of `bin/rails` -> `rails/commands.rb`),
with the same `Handler.Node?.server == null` guard for `server`.

## Acceptance

- A test in trailties: `commands` with a rake task that leaves a pool/handle
  open returns an exit, not a hang.
- A generated app on Postgres: `bin/trails db:migrate` exits 0.
- A new alpha is published, so trailmap#213 can install it.
