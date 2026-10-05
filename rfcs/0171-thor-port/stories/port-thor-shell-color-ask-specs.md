---
title: "Port the six #ask cases of Thor::Shell::Color's spec"
status: in-progress
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - port-thor-line-editor-and-ask
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8538
claim: "2026-10-05T15:39:48Z"
assignee: "arms-extractor-reads-a-block-re-forward-guard"
blocked-by: null
closed-reason: null
---

## Context

`port-thor-shell-color` ported `Thor::Shell::Color` (`packages/trailties/src/thor/shell/color.ts`,
`vendor/thor/v1.3.2/lib/thor/shell/color.rb`) and 18 of the 24 portable cases in
`vendor/thor/v1.3.2/spec/shell/color_spec.rb` (`packages/trailties/src/thor/shell/color.test.ts`).

The six `#ask` cases (`color_spec.rb:15-60`) were left out: each stubs
`Thor::LineEditor.readline` and calls `shell.ask`, and neither `Thor::LineEditor` nor
`Shell::Basic#ask` (`vendor/thor/v1.3.2/lib/thor/shell/basic.rb:80-88`, `ask_simply` `:332-347`,
`ask_filtered` `:349-360`) was on main when `Color` landed. They arrive with
`port-thor-line-editor-and-ask`.

`Color` adds no `ask` of its own. `ask_simply` reaches `prepare_message(statement, *color)`
(`basic.rb:264-267`), which calls `set_color`, so the cases only need the spec ported against
the existing `Color#setColor`. The `beforeEach` in `color.test.ts` already stubs `$stdout.isTTY`
and sets `TERM=ansi` / unsets `NO_COLOR`, mirroring `color_spec.rb:8-13`.

Symbols are colon-prefixed strings here (`lookup_color` turns on `Symbol === color`):
`shell.ask "Is this green?", :green` is `shell().ask("Is this green?", ":green")`, and
`[:blue, true]` is `[":blue", true]`.

## Acceptance criteria

- [ ] The six `#ask` cases are ported into `packages/trailties/src/thor/shell/color.test.ts`
      under `describe("#ask")`, names verbatim:
  - `sets the color if specified and tty?` (`:16`)
  - `does not set the color if specified and NO_COLOR is set to a non-empty value` (`:24`)
  - `sets the color when NO_COLOR is ignored because the environment variable is nil` (`:33`)
  - `sets the color when NO_COLOR is ignored because the environment variable is an empty-string` (`:42`)
  - `handles an Array of colors` (`:51`)
  - `supports the legacy color syntax` (`:56`)
- [ ] `shell/color_spec.rb` reads 24/24 in `pnpm parity:test`, less the `#file_collision` case
      excluded in `scripts/parity/unported-files/thor.ts`.
- [ ] `pnpm parity:test:assertions` stays green (the thor mark is 0/0/0).
