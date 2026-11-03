---
title: "class-paths-table-covers-rails-command"
status: claimed
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-03T14:57:46Z"
assignee: "class-paths-table-covers-rails-command"
blocked-by: null
closed-reason: null
---

## Context

`CorrectableNameError#detailed_message` should end `(Rails::Command::CorrectableNameError)` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:17`), spelled `Trails::Command::…` in trails. The old `class-paths.generated.ts` is gone; trailties' class paths now come from `packages/trailties/src/constants*.generated.ts` (RFC 0213), and none of them names a `Trails::Command::*` class (`grep -n Command packages/trailties/src/constants.generated.ts` is empty). So the test at `packages/trailties/src/commands/server.test.ts:208` only matches `\(.*CorrectableNameError\)`.

## Acceptance criteria

- [ ] The generated constant tables name `Trails::Command::CorrectableNameError`, `UnrecognizedCommandError` and the other `command.rb` classes.
- [ ] `server.test.ts`'s mistype test asserts the full `(Trails::Command::CorrectableNameError)` path.
