---
title: "Port shell/basic_spec.rb, part 1 (padding, indent, ask, yes?, no?, say, say_error)"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-line-editor-and-ask", "port-thor-spec-helper-and-script-fixtures"]
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

The RSpec port of `vendor/thor/v1.3.2/spec/shell/basic_spec.rb` (lines 1–254).

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

## Cases to port (36)

`vendor/thor/v1.3.2/spec/shell/basic_spec.rb`:

- `#padding > cannot be set to below zero` (`:10`)
- `#indent > sets the padding temporarily` (`:20`)
- `#indent > derives padding from original value` (`:25`)
- `#indent > accepts custom indentation amounts` (`:30`)
- `#indent > increases the padding when nested` (`:36`)
- `#ask > prints a message to the user and gets the response` (`:49`)
- `#ask > prints a message to the user prefixed with the current padding` (`:54`)
- `#ask > prints a message and returns nil if EOF is given as input` (`:60`)
- `#ask > prints a message to the user and does not echo stdin if the echo option is set to false` (`:65`)
- `#ask > prints a message to the user with the available options, expects case-sensitive matching, and determines the correctness of the answer` (`:71`)
- `#ask > prints a message to the user with the available options, expects case-sensitive matching, and reasks the question after an incorrect response` (`:77`)
- `#ask > prints a message to the user with the available options, expects case-sensitive matching, and reasks the question after a case-insensitive match` (`:84`)
- `#ask > prints a message to the user with the available options, expects case-insensitive matching, and determines the correctness of the answer` (`:91`)
- `#ask > prints a message to the user with the available options, expects case-insensitive matching, and reasks the question after an incorrect response` (`:97`)
- `#ask > prints a message to the user containing a default and sets the default if only enter is pressed` (`:104`)
- `#ask > prints a message to the user with the available options and reasks the question after an incorrect response and then returns the default` (`:109`)
- `#yes? > asks the user and returns true if the user replies yes` (`:118`)
- `#yes? > asks the user and returns false if the user replies no` (`:123`)
- `#yes? > asks the user and returns false if the user replies with an answer other than yes or no` (`:128`)
- `#no? > asks the user and returns true if the user replies no` (`:135`)
- `#no? > asks the user and returns false if the user replies yes` (`:140`)
- `#no? > asks the user and returns false if the user replies with an answer other than yes or no` (`:145`)
- `#say > prints a message to the user` (`:152`)
- `#say > prints a message to the user without new line if it ends with a whitespace` (`:157`)
- `#say > does not use a new line with whitespace+newline embedded` (`:162`)
- `#say > prints a message to the user without new line` (`:167`)
- `#say > coerces everything to a string before printing` (`:172`)
- `#say > does not print a message if muted` (`:177`)
- `#say > does not print a message if base is set to quiet` (`:184`)
- `#say_error > prints a message to the user` (`:194`)
- `#say_error > prints a message to the user without new line if it ends with a whitespace` (`:199`)
- `#say_error > does not use a new line with whitespace+newline embedded` (`:204`)
- `#say_error > prints a message to the user without new line` (`:209`)
- `#say_error > coerces everything to a string before printing` (`:214`)
- `#say_error > does not print a message if muted` (`:219`)
- `#say_error > does not print a message if base is set to quiet` (`:226`)
