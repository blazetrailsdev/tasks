---
title: "Port Shell::Basic#file_collision (Ynaqdhm menu, diff, merge tool) and wire CreateFile#force_on_collision? to it"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-line-editor-and-ask",
    "port-thor-empty-directory-create-file-and-create-link",
    "ruby-compat-kernel-system-and-open3-capture2e",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CreateFile#on_conflict_behavior` / `force_or_skip_or_conflict` (`vendor/thor/v1.3.2/lib/thor/actions/create_file.rb:73-96`)
reports `conflict` when neither `force` nor `skip` is set, and then recurses as
`force_or_skip_or_conflict(force_on_collision?, true)`. `force_on_collision?` calls
`base.shell.file_collision(destination) { render }` (`:100-102`).

`Thor::Shell::Basic#file_collision` (`vendor/thor/v1.3.2/lib/thor/shell/basic.rb:207-244`) prompts
`Overwrite <dest>? (enter "h" for help) [Ynaqdhm]` (or `[Ynaqh]` without a block). It loops:
`nil` (EOF) → say `""`, true; `y` / `f` / `""` → true; `n` / `s` → false; `a` → `@always_force =
true`; `q` → `Aborting...` then `SystemExit`; `d` → `show_diff` then `Retrying...`; `m` →
`merge` via `THOR_MERGE` or `git config merge.tool`; anything else → `file_collision_help`. Also
protected `file_collision_help` (`:296-311`), `show_diff` (`:313-322`, `THOR_DIFF` /
`RAILS_DIFF` / `diff -u` over a Tempfile), `merge` / `merge_tool` / `git_merge_tool`
(`:370-385`).

trails' `GeneratorBase#createFile` conflict arm always forces, which is Thor's answer only at
EOF. An interactive refusal cannot be expressed.

## Fidelity traps (predicted at authoring)

- [ ] **Async.** `file_collision` awaits `ask`, `show_diff` / `merge` await `system`, and the
      `{ render }` block may itself await.
- [ ] **`return @always_force = true`** returns the assignment's value.
- [ ] **`raise SystemExit`** is ruby-compat's `SystemExit`, which `start`'s rescue does not
      catch (it is not a `Thor::Error`).
- [ ] **`when is?(:yes), is?(:force), ""`**: the case/when compares a Regexp (`===`, a match) and
      a String (`==`).

## Acceptance criteria

- [ ] With `n` answered, an existing changed file is left untouched and reported `conflict`
      then `skip`. With EOF or `y`, it is overwritten and reported `conflict` then `force`. `a`
      forces every later collision in the same shell.
- [ ] `basic_spec.rb`'s `#file_collision` cases (13) are ported in
      `port-thor-shell-basic-spec-part-2`.
