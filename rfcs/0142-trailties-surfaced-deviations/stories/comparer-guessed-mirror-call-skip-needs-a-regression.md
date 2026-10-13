---
title: "parity: the comparer's guessed-mirror call-gate skip has no regression test"
status: ready
updated: 2026-10-13
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

trails#8838 added an arm to `scripts/api-compare/compare.ts`: when the
misplaced-cluster guess (`selectMisplacedFile`) lands an unported Ruby file on
a TS file that is another Ruby file's own conventional mirror, the call gates
are skipped for a Ruby method name that mirrored file defines
(`rubyNamesByMirrorTs`, read at the misplaced-fallback `checkArity` call).

It was written for `Rails::Command::DbconsoleCommand#perform`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/dbconsole/dbconsole_command.rb:82-85`),
which the guess had paired with the unported
`commands/initializers/initializers_command.rb` and
`commands/runner/runner_command.rb`, two commands that also
`include EnvironmentArgument` and define `perform`.

The arm has no regression test. `scripts/api-compare/compare.test.ts` passes
with or without it.

## Acceptance criteria

- [ ] `compare.test.ts` has a case with an unported Ruby file whose method name
      is also defined by the Ruby file a ported TS file mirrors, guessed onto
      that TS file, asserting no call-mismatch row is produced for it.
- [ ] The case fails with the `rubyNamesByMirrorTs` argument removed.
