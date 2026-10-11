---
title: "ruby-compat: Open3.capture2e takes argv and spawn options, the port takes one shell string"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ChildProcessAdapter#capture2e` (`packages/ruby-compat/src/child-process-adapter.ts:57-60`, node backend at `:182`) takes one `command: string` and an `env`, and always runs it through `/bin/sh -c`.

Ruby's `Open3.capture2e(*cmd)` (`vendor/ruby/v3.3.11/lib/open3.rb:902-908`) takes what `Process.spawn` takes: `capture2e([env,] cmd, arg1, ..., opts)`. With more than one word it execs the argv with no shell, and a trailing Hash carries spawn options such as `chdir:`. `popen_run` passes them straight to `spawn(*cmd, opts)` (`open3.rb:533-534`).

The port therefore has no way to pass an argument that is not shell-safe, and no way to set the child's working directory. trailmap#54 hit both: `ProbesController#checkGitIdentity` (trailmap `app/controllers/probes-controller.ts`) needs `git -C <dir> var GIT_AUTHOR_IDENT` with an arbitrary directory. It first hand-quoted the path into the command line, which review rejected, and now smuggles it through the environment as `git -C "$UP_READY_DIR" ...`. That workaround is the finding.

`system` on the same adapter already has the argv arm (`args?: string[] | null`, `:44-50`); `capture2e` does not.

## Acceptance criteria

- [ ] `capture2e` accepts an argv form that execs with no shell, as `Open3.capture2e("git", "-C", dir, "var", name)` does
- [ ] `capture2e` accepts spawn options, at least `chdir:`, as the trailing-Hash arm of `open3.rb:903-907` does
- [ ] The single-string form keeps going through `/bin/sh -c`
- [ ] Tests cover an argument containing spaces, `$VAR` and quotes arriving verbatim, and `chdir`
- [ ] Once vendored into trailmap, `checkGitIdentity` drops `UP_READY_DIR`
