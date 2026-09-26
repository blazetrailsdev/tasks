---
title: "Dir.mkdir drops its permissions argument, so mktmpdir and fu_mkdir chmod after the create"
status: draft
updated: 2026-09-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Dir.mkdir(path, perm)` (`vendor/ruby/dir.c:1494`) creates the directory with its mode. `Dir.mktmpdir` depends on that: it calls `mkdir(path, 0700)` (`vendor/ruby/lib/tmpdir.rb:95`), so the directory is never visible with a wider mode.

trails' `FsAdapter#mkdirSync` (`packages/ruby-compat/src/fs-adapter.ts:55`) takes only `{ recursive }`. So there are two consequences:

- `Dir.mkdir` (`packages/ruby-compat/src/dir.ts`) has no `perm` parameter.
- `Dir.mktmpdir` (trails#8118) and `fu_mkdir` (`packages/ruby-compat/src/file-utils.ts`, `fileutils.rb:396-404`) create the directory first and then `chmodSync` it. That leaves a window where it is visible with the umask default mode.

## Converged shape

- `FsAdapter#mkdirSync(path, { recursive?, mode? })`, and the node adapter passes `mode` through to `fs.mkdirSync`.
- `Dir.mkdir(dirname, permissions = 0o777)` hands `permissions` to the create call, as `dir_s_mkdir` does.
- `Dir.mktmpdir` calls `Dir.mkdir(path, 0o700)`, and `fuMkdir` calls `Dir.mkdir(path, mode)`. Neither follows up with `chmodSync`.

## Acceptance criteria

- [ ] `Dir.mkdir` takes Ruby's `permissions` argument and creates the directory with it.
- [ ] `Dir.mktmpdir` and `fuMkdir` no longer chmod after the create.
- [ ] A trails test pins a `0o700` mode on `Dir.mkdir(path, 0o700)`.
