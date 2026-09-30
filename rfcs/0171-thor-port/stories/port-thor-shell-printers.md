---
title: "Port Thor::Shell::ColumnPrinter, TablePrinter and WrappedPrinter"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-shell-module-basic-output-and-terminal"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/shell/column_printer.rb` (29), `vendor/thor/v1.3.2/lib/thor/shell/table_printer.rb` (118) and
`vendor/thor/v1.3.2/lib/thor/shell/wrapped_printer.rb` (38), with `Basic#print_in_columns` / `print_table` /
`print_wrapped` (`vendor/thor/v1.3.2/lib/thor/shell/basic.rb:165-197`). They print every Thor help screen:
`print_options` uses `print_table(list, indent: 2)` (`vendor/thor/v1.3.2/lib/thor/base.rb:672`), and `Thor.help` uses
`truncate: true` (`vendor/thor/v1.3.2/lib/thor/../thor.rb:301`). railties' `Rails::Command.printing_commands` / help
output goes through `print_table` too.

## Fidelity traps (predicted at authoring)

- [ ] **Ruby `format` strings**: `"%-#{maxima}s"`, `"%#{maxima}s"`, `f % column.to_s`. Port
      them through ruby-compat's `kernel-format`, not `padEnd`, so multibyte width handling matches
      Ruby's `String#%`.
- [ ] **`BORDER_SEPARATOR = :separator`** is the string `":separator"` (a colon-prefixed Symbol
      value), compared with `==`.
- [ ] **`truncate`** uses `Terminal.terminal_width` when `truncate: true`, and appends `"..."`.
- [ ] **`WrappedPrinter`** wraps on whitespace, with `Terminal.terminal_width - indent`.

## Acceptance criteria

- [ ] The three files read complete in `parity:api --package thor`. `basic_spec.rb`'s
      `#print_table` / `#print_in_columns` / `#print_wrapped` cases are in
      `port-thor-shell-basic-spec-part-2`.
