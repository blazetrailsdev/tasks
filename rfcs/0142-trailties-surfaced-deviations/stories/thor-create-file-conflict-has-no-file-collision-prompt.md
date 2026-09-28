---
title: "Thor CreateFile conflict arm always forces: no file_collision prompt"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`GeneratorBase#createFile` (`packages/trailties/src/generators/base.ts`, conflict arm) ports Thor's
`CreateFile#on_conflict_behavior` / `force_or_skip_or_conflict`
(thor-1.3.2 `lib/thor/actions/create_file.rb:71-94`). When neither `force` nor `skip` is set, Thor
reports `conflict` and then recurses as `force_or_skip_or_conflict(force_on_collision?, true)`.
`force_on_collision?` calls `base.shell.file_collision(destination)`
(thor-1.3.2 `lib/thor/shell/basic.rb:207-244`), which prompts `Overwrite <dest>? (enter "h" for help) [Ynaqh]`
and honors a refusal (`n` means skip, `q` raises SystemExit, `a` means always force).

trails has no Thor shell and no `ask`, so the arm reports `conflict` and then always forces. That is
Thor's answer only when `ask` reads EOF (`basic.rb:217-220`); an interactive refusal cannot be expressed.

## Converged shape

- `GeneratorBase` gains Thor's `file_collision(destination)` over a line-reading `ask`, with the
  Ynaqh menu, `@always_force`, and `nil` (EOF) meaning yes.
- The conflict arm in `createFile` calls it, and on `false` reports `skip` and leaves the file alone.

## Acceptance criteria

- With `n` answered, an existing changed file is left untouched and reported `conflict`, then `skip`.
- With EOF or `y`, it is overwritten and reported `conflict`, then `force`; `a` forces every later collision.
