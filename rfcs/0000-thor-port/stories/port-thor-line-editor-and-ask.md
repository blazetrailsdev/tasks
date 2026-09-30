---
title: "Port Thor::LineEditor (Basic) and Shell::Basic#ask / yes? / no? (async)"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-shell-module-basic-output-and-terminal",
    "ruby-compat-io-gets-and-noecho-for-line-editor",
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

- `vendor/thor/v1.3.2/lib/thor/line_editor.rb` (17): `readline(prompt, options)` over `best_available`, which detects
  `[Readline, Basic]`. `Readline` is unported (`enroll-thor-specs-in-parity-test`), so
  `best_available` answers `Basic`, and that is recorded at the call.
- `vendor/thor/v1.3.2/lib/thor/line_editor/basic.rb` (37): `available?`, `initialize`, `readline`, and private
  `get_input` / `echo?`.
- `vendor/thor/v1.3.2/lib/thor/shell/basic.rb`: `ask` (`:80-89`), `yes?` / `no?` (`:149-158`), and protected `is?`
  (`:286-294`), `ask_simply` (`:332-347`), `ask_filtered` (`:349-360`), `answer_match`
  (`:362-368`).

Rails' `app_base.rb` and the credentials commands prompt through these, and
`file_collision` (the rehomed `thor-create-file-conflict-has-no-file-collision-prompt`) is
built on `ask`.

## Fidelity traps (predicted at authoring)

- [ ] **Async cascade.** `readline` awaits `$stdin.gets`, so `ask`, `yes?`, `no?`,
      `ask_simply` and `ask_filtered` are async, and so is every shell delegate that reaches
      them. RFC decision 4.
- [ ] **`ask_simply` returns `nil` at EOF** (`return unless result`) before `strip`. Keep
      `null` distinct from `""`: `file_collision` treats them differently.
- [ ] **`[statement, ("(#{default})" if default), nil].uniq.join(" ")`**: `uniq` drops the
      duplicate `nil`, and `join` renders `nil` as `""`, which leaves a trailing space. Port that
      exactly; the prompt text is asserted.
- [ ] **`is?(value)`** builds `/\A#{value}\z/i` or `/\A(yes|y)\z/i` without escaping. Mirror it.
- [ ] **`yes?`** is `!!(ask(...) =~ is?(:yes))`: `nil =~` is `nil`, which is false.
- [ ] **`limited_to` loop** re-asks until `answer_match` finds a value, and says
      `Your response must be one of: [...]. Please try again.`

## Acceptance criteria

- [ ] The members above read complete in `parity:api --package thor`.
- [ ] `vendor/thor/v1.3.2/spec/line_editor/basic_spec.rb` (3) and the Basic arm of `vendor/thor/v1.3.2/spec/line_editor_spec.rb` (1)
      are ported. `basic_spec.rb`'s `#ask` / `#yes?` / `#no?` are in `port-thor-shell-basic-spec-part-1`.

## Cases to port (4)

`vendor/thor/v1.3.2/spec/line_editor/basic_spec.rb`:

- `.available? > returns true` (`:5`)
- `#readline > uses $stdin and $stdout to get input from the user` (`:11`)
- `#readline > disables echo when asked to` (`:19`)

`vendor/thor/v1.3.2/spec/line_editor_spec.rb`:

- `on a system without Readline support > .readline > uses the Basic line editor` (`:37`)
