---
title: "ruby-compat: async Kernel#system and Open3.capture2e for Thor's run"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["ruby-compat"]
deps: []
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

`Thor::Actions#run` (`vendor/thor/v1.3.2/lib/thor/actions.rb:248-277`) runs a shell command with
`system(*env_splat, command.to_s)`, or `Open3.capture2e(*env_splat, command.to_s)` when
`config[:capture]` is set. It then aborts if the command failed and
`config.fetch(:abort_on_failure, self.class.exit_on_failure?)` holds. `Shell::Basic#show_diff`
and `#merge` (`vendor/thor/v1.3.2/lib/thor/shell/basic.rb:313-322,370-377`) also call `system`, and `git_merge_tool`
(`:383-385`) uses backticks.

ruby-compat's `ChildProcessAdapter` has only `spawnSync`
(`packages/ruby-compat/src/child-process-adapter.ts`). Rails' generators call `run` for
`bundle install`, `git init` and similar commands, which can run for a long time. A sync
spawn would block the event loop, and a prompt could not be answered while it runs.

## Acceptance criteria

- [ ] `rbKernelSystem(env?, command)` (async) returns `true` / `false` / `null` with Ruby's
      meaning. `null` means the command could not be executed.
- [ ] `Open3.capture2e(env?, command)` (async) returns `[output, status]`, where `status` is
      a `Process::Status` with `isSuccess()`.
- [ ] A shell-string command runs through `/bin/sh -c`, as Ruby's single-string `system`
      does, and the `env` hash is merged over `ENV`.
- [ ] Both are declared on the `ChildProcessAdapter` interface. A browser adapter may omit
      them; calling one there raises `NotImplementedError`.
