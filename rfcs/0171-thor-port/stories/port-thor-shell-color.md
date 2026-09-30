---
title: "Port Thor::Shell::Color (ANSI constants, set_color, NO_COLOR / TERM=dumb)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-shell-module-basic-output-and-terminal"]
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/shell/color.rb` (115 lines): the 18 ANSI constants (`:13-49`), `set_color` (`:82-98`, the
Symbol/String arm and the legacy `(foreground, bold)` arm), and protected
`can_display_colors?` / `are_colors_supported?` (`stdout.tty? && ENV["TERM"] != "dumb"`) /
`are_colors_disabled?` (`NO_COLOR` set and non-empty). `include LCSDiff` (`:10`) is not ported
(`diff-lcs` is not vendored; `enroll-thor-specs-in-parity-test`), so `show_diff` is `Basic`'s.
`Thor::Base.shell` defaults to `Color` off Windows (`vendor/thor/v1.3.2/lib/thor/shell.rb:11-19`).

## Fidelity traps (predicted at authoring)

- [ ] **`colors.all? { |c| c.is_a?(Symbol) || c.is_a?(String) }`**: both are JS strings, so
      the legacy arm is reached only by a non-string second element (`true` for bold).
- [ ] **`lookup_color`** passes a String color through unchanged and upcases a Symbol into a
      constant name. A trails Symbol is a plain string, so `":red"` / `"red"` spelling follows
      CLAUDE.md's Symbol rule: `say_status :create, :green` is `sayStatus("create", "green")`, and
      `lookup_color` looks up `"GREEN"`.

## Acceptance criteria

- [ ] `color.rb` reads complete in `parity:api --package thor`, less `LCSDiff`.
- [ ] `vendor/thor/v1.3.2/spec/shell/color_spec.rb`'s 24 portable cases are ported. The one diff case that needs
      `diff-lcs` reads as unported, with the same reason as `lcs_diff.rb`.

## Cases to port (24)

`vendor/thor/v1.3.2/spec/shell/color_spec.rb`:

- `#ask > sets the color if specified and tty?` (`:16`)
- `#ask > does not set the color if specified and NO_COLOR is set to a non-empty value` (`:24`)
- `#ask > sets the color when NO_COLOR is ignored because the environment variable is nil` (`:33`)
- `#ask > sets the color when NO_COLOR is ignored because the environment variable is an empty-string` (`:42`)
- `#ask > handles an Array of colors` (`:51`)
- `#ask > supports the legacy color syntax` (`:56`)
- `#say > set the color if specified and tty?` (`:63`)
- `#say > does not set the color if output is not a tty` (`:71`)
- `#say > does not set the color if NO_COLOR is set to any value that is not an empty string` (`:80`)
- `#say > colors are still used and NO_COLOR is ignored if the environment variable is nil` (`:89`)
- `#say > colors are still used and NO_COLOR is ignored if the environment variable is an empty-string` (`:98`)
- `#say > does not use a new line even with colors` (`:107`)
- `#say > handles an Array of colors` (`:115`)
- `#say > supports the legacy color syntax` (`:123`)
- `#say_status > uses color to say status` (`:133`)
- `#set_color > colors a string with a foreground color` (`:143`)
- `#set_color > colors a string with a background color` (`:148`)
- `#set_color > colors a string with a bold color` (`:153`)
- `#set_color > does nothing when there are no colors` (`:164`)
- `#set_color > does nothing when stdout is not a tty` (`:172`)
- `#set_color > does nothing when the TERM environment variable is set to 'dumb'` (`:178`)
- `#set_color > does nothing when the NO_COLOR environment variable is set to a non-empty string` (`:184`)
- `#set_color > sets color when the NO_COLOR environment variable is ignored for being nil` (`:191`)
- `#set_color > sets color when the NO_COLOR environment variable is ignored for being an empty string` (`:202`)
