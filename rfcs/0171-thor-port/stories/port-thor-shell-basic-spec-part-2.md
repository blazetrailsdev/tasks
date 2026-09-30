---
title: "Port shell/basic_spec.rb, part 2 (print_wrapped, say_status, print_in_columns, print_table, file_collision)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-shell-printers",
    "thor-create-file-conflict-has-no-file-collision-prompt",
    "port-thor-spec-helper-and-script-fixtures",
  ]
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

The RSpec port of `vendor/thor/v1.3.2/spec/shell/basic_spec.rb` (lines 255–9999).

Port each case at its Ruby name (`describe` / `it` strings unchanged; `parity:test`
matches on them). Expectations map `expect(x).to eq(y)` → `expect(x).toEqual(y)`,
`raise_error(K, /m/)` → `rejects.toThrow` / `toThrow`, and `capture(:stdout) { }` → the
spec helper's `capture("stdout", async () => ...)`. A case that cannot run under trails
(for example, one that shells out to `ruby`) is `it.skip` with the RFC's reason, not deleted.

## Acceptance criteria

- [ ] Every case listed below exists at its Ruby name and passes. `pnpm parity:test` credits it
      in the `thor` block.
- [ ] No case is renamed. A case that exposes a port bug is fixed in the port (or filed against
      this RFC with the Ruby `file:line`), not rewritten.

## Cases to port (35)

`vendor/thor/v1.3.2/spec/shell/basic_spec.rb`:

- `#print_wrapped > properly wraps the text around the 80th column` (`:255`)
- `#print_wrapped > properly wraps the text around the 80th column` (`:269`)
- `#say_status > prints a message to the user with status` (`:276`)
- `#say_status > always uses new line` (`:281`)
- `#say_status > indents a multiline message` (`:286`)
- `#say_status > does not print a message if base is muted` (`:300`)
- `#say_status > does not print a message if base is set to quiet` (`:309`)
- `#say_status > does not print a message if log status is set to false` (`:318`)
- `#say_status > uses padding to set message's left margin` (`:323`)
- `#print_in_columns > prints in columns` (`:336`)
- `#print_table > prints a table` (`:350`)
- `#print_table > prints a table with indentation` (`:359`)
- `#print_table > uses maximum terminal width` (`:368`)
- `#print_table > honors the colwidth option` (`:381`)
- `#print_table > prints tables with implicit columns` (`:390`)
- `#print_table > prints a table with small numbers and right-aligns them` (`:400`)
- `#print_table > doesn't output extra spaces for right-aligned columns in the last column` (`:412`)
- `#print_table > prints a table with big numbers` (`:424`)
- `#print_table > prints a table with borders` (`:436`)
- `#print_table > prints a table with borders and separators` (`:447`)
- `#print_table > prints a table with borders and small numbers and right-aligns them` (`:460`)
- `#print_table > prints a table with borders and indentation` (`:474`)
- `#file_collision > shows a menu with options` (`:490`)
- `#file_collision > outputs a new line and returns true if stdin is closed` (`:495`)
- `#file_collision > returns true if the user chooses default option` (`:501`)
- `#file_collision > returns false if the user chooses no` (`:506`)
- `#file_collision > returns true if the user chooses yes` (`:511`)
- `#file_collision > shows help usage if the user chooses help` (`:516`)
- `#file_collision > quits if the user chooses quit` (`:522`)
- `#file_collision > always returns true if the user chooses always` (`:531`)
- `#file_collision > when a block is given > displays diff and merge options to the user` (`:541`)
- `#file_collision > when a block is given > invokes the diff command` (`:546`)
- `#file_collision > when a block is given > invokes the merge tool` (`:553`)
- `#file_collision > when a block is given > invokes the merge tool that specified at ENV['THOR_MERGE']` (`:560`)
- `#file_collision > when a block is given > show warning if user chooses merge but merge tool is not specified` (`:567`)
