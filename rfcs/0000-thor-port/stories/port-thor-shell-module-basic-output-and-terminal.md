---
title: "Port Thor::Shell (delegation, with_padding) and Shell::Basic's output half, plus Shell::Terminal"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-errors-nested-context-and-version"]
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/thor/v1.3.2/lib/thor/shell.rb` (81 lines): `Thor::Base.shell` / `shell=` (`:4-21`, `THOR_SHELL`, the Windows
  arm, default `Color`), `SHELL_DELEGATED_METHODS` (`:24`) and their generated delegates
  (`:57-63`), `initialize` (`:44-48`, `shell.base ||= self`), `shell`, `with_padding`
  (`:66-71`), and `_shared_configuration` (`:77-79`).
- `vendor/thor/v1.3.2/lib/thor/shell/basic.rb` output half: `initialize`, `mute` / `mute?`, `padding=` (clamped at 0),
  `indent`, `say` (`:98-106`, whose `force_new_line` default is computed from `message`),
  `say_error`, `say_status` (`:130-144`), `error`, `set_color` (identity), and protected
  `prepare_message`, `can_display_colors?`, `lookup_color`, `stdout`, `stderr`, `quiet?`,
  `unix?`.
- `vendor/thor/v1.3.2/lib/thor/shell/terminal.rb` (42 lines): `terminal_width` (`THOR_COLUMNS`, `stty size`,
  `tput cols`, the `< 10` floor) and `unix?`.

trailties stand-ins this replaces: `GeneratorBase.say` / `sayStatus` / `isQuiet`
(`packages/trailties/src/generators/base.ts:212-235`, `@noRailsEquivalent PERMANENT`) and
`command/base.ts`' `say` (`:124-127`). Rails' generators call `say` 73 times and
`say_status` 13 times.

## Fidelity traps (predicted at authoring)

- [ ] **Generated delegates** (`module_eval "def #{method}(*args,&block)"`) are 13 real
      methods: `ask`, `error`, `set_color`, `yes?`, `no?`, `say`, `say_error`, `say_status`,
      `print_in_columns`, `print_table`, `print_wrapped`, `file_collision`, `terminal_width`.
      Port them as prototype methods so `parity:api` scores them. `ask` / `yes?` / `no?` /
      `file_collision` return the shell's promise.
- [ ] **`with_padding` / `mute` / `indent` restore on settle** when the block is async. Every
      generator `invoke` runs inside `with_padding` (`vendor/thor/v1.3.2/lib/thor/group.rb:277`).
- [ ] **`say`'s default `force_new_line = (message.to_s !~ /( |\t)\Z/)`**: the default depends
      on an earlier parameter. `\Z` matches before a final newline. Use a sentinel for "not passed",
      not a JS default expression that swallows an explicit `undefined`.
- [ ] **`say_status`**: `status.to_s.rjust(12)`, color `log_status.is_a?(Symbol) ? log_status
: :green`, and `gsub(/(?<!\A)^/, margin)` to indent continuation lines.
- [ ] **`lookup_color`** is `self.class.const_get(color.to_s.upcase)`, a constant lookup on the
      shell class (`Color::RED`). Keep the constants as static members and the lookup by name.
- [ ] **`quiet?`** is `mute? || (base && base.options[:quiet])`, reading the host's options
      hash.
- [ ] **`stdout` / `stderr`** are `$stdout` / `$stderr`, the ruby-compat process adapter
      streams, so the spec helper's `capture(:stdout)` can swap them.

## Acceptance criteria

- [ ] `shell.rb`, `terminal.rb` and the members above read complete in `parity:api --package thor`.
- [ ] `vendor/thor/v1.3.2/spec/shell_spec.rb` (5) is ported.

## Cases to port (5)

`vendor/thor/v1.3.2/spec/shell_spec.rb`:

- `#initialize > sets shell value` (`:9`)
- `#initialize > sets the base value on the shell if an accessor is available` (`:14`)
- `#shell > returns the shell in use` (`:21`)
- `#shell > uses $THOR_SHELL` (`:25`)
- `with_padding > uses padding for inside block outputs` (`:39`)
