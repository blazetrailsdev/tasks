---
title: "ruby-compat: FileUtils calls File.readlink instead of a private fileReadlink copy"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8489 added `File.readlink` to ruby-compat (`packages/ruby-compat/src/file.ts`, `rb_file_s_readlink`,
`vendor/ruby/v3.3.11/file.c:3115`), which raises `NotImplementedError` on a backend with no `readlinkSync`.

`packages/ruby-compat/src/file-utils.ts:147-153` still carries a module-private `fileReadlink` with the same
body, and its JSDoc cites `vendor/ruby/v3.3.11/file.c:3081`, which is not `rb_file_s_readlink`'s line. Ruby's
`FileUtils` calls `File.readlink` itself (`vendor/ruby/v3.3.11/lib/fileutils.rb`, `Entry_#copy`).

## Acceptance criteria

- [ ] `file-utils.ts` calls `File.readlink` where Ruby's `fileutils.rb` does, and the private `fileReadlink`
      helper is deleted.
- [ ] The file-utils tests covering the symlink copy arm still pass.
