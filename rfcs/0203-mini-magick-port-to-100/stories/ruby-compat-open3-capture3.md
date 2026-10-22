---
title: "Port Open3.capture3 to ruby-compat over the child-process adapter"
status: ready
updated: 2026-10-22
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-prereqs
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`MiniMagick::Shell#execute` (`vendor/mini_magick/v5.2.0/lib/mini_magick/shell.rb:29-40`)
is:

```ruby
Open3.capture3(env, *command, stdin_data: stdin, unsetenv_others: MiniMagick.restricted_env)
```

rescuing `Errno::ENOENT` and `IOError` into `["", "executable not found: …", 127]`.
ruby-compat's `Open3` (`packages/ruby-compat/src/open3.ts`) ports only
`capture2e` (`vendor/ruby/v3.3.11/lib/open3.rb:902`), for Thor, over the
child-process adapter (`child-process-adapter.ts`).

## Acceptance criteria

- `Open3.capture3([env, ] *cmd, stdin_data:, unsetenv_others:)`
  (`vendor/ruby/v3.3.11/lib/open3.rb`, `capture3`) is async and answers
  `[stdout, stderr, Process::Status]`; the argv is spawned without a shell, as
  `Process.spawn` with several arguments does.
- `stdin_data` is written to the child's stdin; `unsetenv_others: true` gives
  the child only `env`.
- A command that cannot be spawned raises `Errno::ENOENT`, as `capture2e` does.
- ruby-compat tests cover stdout/stderr separation, stdin, the restricted
  environment and the missing-executable error.
