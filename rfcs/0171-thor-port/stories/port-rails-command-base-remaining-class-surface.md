---
title: "port-rails-command-base-remaining-class-surface"
status: ready
updated: 2026-10-29
rfc: "0171-thor-port"
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

trails#9392 rebased `packages/trailties/src/command/base.ts` onto Thor
(`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:14`). Its story's
acceptance criteria were the Thor stand-ins only, so the rest of
`Rails::Command::Base`'s class surface is still unported:

- `engine?` (`base.rb:28-31`)
- `desc` with the USAGE fallback (`:33-40`)
- `inherited` registering into `Rails::Command.subclasses` (`:52-58`; per
  CLAUDE.md § "`inherited` is deferred to own-property memo guards")
- `printing_commands` (`:76-80`)
- class-level `help` printing `class_usage` (`:97-101`)
- `base_name` (`:104-109`), `class_usage` (`:121-125`), `usage_path`
  (`:128-131`), `default_command_root` (`:137-140`), private `resolve_path`
  (`:160-164`)
- `no_commands` `invoke_command` / `current_subcommand` / `executable`
  delegation (`:168-180`)

`class_usage` renders a USAGE file through ERB; in trails that is a
precompiled `.tse`/`.tt` template (CLAUDE.md § "Templates are precompiled").

## Acceptance criteria

- [ ] Each method above is ported on `command/base.ts` at its Rails name and control flow.
- [ ] `help` prints Thor's help followed by `class_usage` when a USAGE file exists.
- [ ] `printing_commands` is what `Rails::Command` uses to list commands.
