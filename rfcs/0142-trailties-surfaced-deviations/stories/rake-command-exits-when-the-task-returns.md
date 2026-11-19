---
title: "trails rake dispatch ends the process when the task returns, as Ruby's interpreter does"
status: draft
updated: 2026-11-19
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

`packages/trailties/lib/commands/rake.ts` `RakeCommand.perform` calls
`ActiveRecord.disconnectAllBang()` in a `finally` once the rake application
has run (trails#10370). Rails' `Rails::Command::RakeCommand#perform`
(`railties/lib/rails/commands/rake/rake_command.rb`) makes no such call:
a Ruby process terminates when its main script ends, whatever sockets are
open. A Node process stays alive while a pool socket is open, so a booted
rake task (`db:seed`, `db:prepare`, a user task depending on `:environment`)
whose initializers established a pool would never exit.

The receipt is `@inventedArm try|disconnectAllBang — CONVERGEABLE
rake-command-exits-when-the-task-returns`.

## Acceptance criteria

- Either converge: trails' command entry ends the process the way Ruby's
  interpreter does once a non-serving command returns (with `server`/`dev`
  still alive, since `rackup`'s Node handler returns from `run` while
  listening), and the invented call in `RakeCommand.perform` is removed.
- Converging also removes `rake.ts`'s top-level
  `import { disconnectAllBang } from "@blazetrails/activerecord"`, which loads
  Active Record for every rake invocation although railties'
  `rake_command.rb` knows nothing of it (`dbconsole.ts` carries the same
  import). If the receipt is ratified instead, keep the import lazy or
  justify it there.
- Or get the deviation ratified under trails CLAUDE.md "Runtime facts Node
  does not expose" and flip the receipt to `PERMANENT`.
