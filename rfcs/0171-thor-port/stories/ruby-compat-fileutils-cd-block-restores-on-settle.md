---
title: "ruby-compat: FileUtils.cd(dir) { } that restores the working directory when an async block settles"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
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

`Thor::Actions#inside` (`vendor/thor/v1.3.2/lib/thor/actions.rb:170-196`) runs its block under
`FileUtils.cd(destination_root) { ... }`, and `in_root` (`:200-202`) goes through it.
Rails' generator actions call `inside` / `in_root` 45 times
(`vendor/rails/v8.0.2/railties/lib`), including around `run` (`rails/generators/actions.rb`)
so shell commands execute in the app directory.

ruby-compat's `FileUtils` (`packages/ruby-compat/src/file-utils.ts`) has no `cd`. The process
adapter has `chdir` (`packages/ruby-compat/src/process-adapter.ts:98`). A trails `inside` block
is async (it awaits actions), so a sync restore would pop the directory before the block's
work runs. That is the trap in memory "Ruby `set; yield; ensure restore` must defer restore
to promise SETTLE".

`FileUtils.cd` changes a process-global directory in Ruby too. Two concurrent generators
in one Ruby process would race in the same way, so no scoping beyond Ruby's is invented here.

## Acceptance criteria

- [ ] `FileUtils.cd(dir, block?)` ports `fileutils.rb`'s `cd` (`Dir.chdir` with a block).
      When the block returns a promise, the previous directory is restored after it settles,
      whether it resolves or rejects.
- [ ] A `.trails.test.ts` case fails on the naive port: a block that awaits before reading
      `Dir.pwd()` still sees the inner directory.
- [ ] Without a block, `cd` chdirs and returns, as Ruby does.
