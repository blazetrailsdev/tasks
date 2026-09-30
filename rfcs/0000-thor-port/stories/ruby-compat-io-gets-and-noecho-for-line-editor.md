---
title: "ruby-compat: async $stdin.gets and IO#noecho for Thor::LineEditor::Basic"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::LineEditor::Basic#readline` (`vendor/thor/v1.3.2/lib/thor/line_editor/basic.rb:15-34`) prints the prompt and
reads with `$stdin.gets`, or `$stdin.noecho(&:gets)` when `echo: false` (passwords). Every
Thor prompt goes through it: `ask`, `yes?`, `no?` and `file_collision`
(`vendor/thor/v1.3.2/lib/thor/shell/basic.rb:80-89,149-158,207-244`).

ruby-compat's process adapter wraps stdin for `isTTY` and a whole-stream `read`
(`packages/ruby-compat/src/process-adapter.ts:88-94,265-300`). It has no line read and no
echo control. `gets` returns `nil` at EOF, and Thor maps a `nil` answer to "yes" in
`file_collision` (`basic.rb:218-220`), so EOF must stay distinguishable from `""`.

## Acceptance criteria

- [ ] `stdin.gets()` (async) resolves to the next line **including** its trailing `"\n"`,
      as `IO#gets` does, or to `null` at EOF. Buffered data beyond the line is kept for the next
      call.
- [ ] `stdin.noecho(block)` disables terminal echo for the block (raw mode on a TTY) and
      restores it after the block settles.
- [ ] Tests drive both through a fake stdin stream.
