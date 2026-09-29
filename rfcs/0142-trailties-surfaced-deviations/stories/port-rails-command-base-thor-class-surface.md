---
title: "Port Rails::Command::Base's Thor class surface onto command/base.ts"
status: in-progress
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: trails#8247
claim: "2026-09-29T18:37:12Z"
assignee: "port-form-builder-submit-and-submit-tag"
blocked-by: null
closed-reason: null
---

## Context

trails#8183 added `packages/trailties/src/command/base.ts`, a minimal
`Rails::Command::Base` (`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:14`,
`class Base < Thor`). It holds only Thor's `options` and a `say` that writes
with `console.log`. `UnusedRoutesCommand`
(`packages/trailties/src/commands/unused-routes.ts`) extends it. The rest of the
command's Rails class body still lives in the Commander factory
`unusedRoutesCommand()` instead of on the class:

- `hide_command!` (`unused_routes_command.rb:8`, `base.rb:55-57`)
- `class_option :controller, aliases: "-c"` / `class_option :grep, aliases: "-g"`
  (`unused_routes_command.rb:9-10`)
- `perform(*)` dispatch (`base.rb:67-74`, `perform(command, args, config)`)
- the class methods `desc` / `namespace` / `banner` / `executable` / `command_name`
  (`base.rb:22-172`)

`say` also skips Thor's shell. `Thor::Shell::Basic#say` honours `quiet?` and adds
the newline only when the message does not end in whitespace (thor 1.3.2
`shell/basic.rb`). Thor is not vendored, which is the same blocker as
`generators-have-no-thor-source-paths-or-template-files`.

## Converged shape

- `Command::Base` carries `hideCommandBang`, `classOption`, `namespace`,
  `commandName`, `executable` and `perform` with the Rails names and control
  flow from `base.rb`.
- `desc` (`base.rb:34-40`) and `banner` (`base.rb:86-95`) are out of scope:
  `desc`'s no-usage arm is `class_usage`, which needs a USAGE file read plus a
  TSE render, and `banner`'s command arm is Thor's `formatted_usage`. Both move
  to `port-rails-command-base-usage-and-banner`.
- `UnusedRoutesCommand` declares `hideCommandBang()` and its two `classOption`s
  in a `static {}` block, as the Ruby class body does. The Commander wiring in
  `unused-routes.ts` is derived from them, not hand-written.
- `say` routes through a Thor shell port (with `quiet?`) once thor is vendored.

## Acceptance criteria

- The items above are ported onto `command/base.ts`, and `unused-routes.ts`
  uses them.
- `unused-routes.test.ts` (hidden command, class options) still passes against
  the derived wiring.
