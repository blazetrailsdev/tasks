---
title: "ruby-compat: FileUtils.compare_file / identical? unported"
status: draft
updated: 2026-10-29
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

Thor's `directory_spec.rb` helper `exists_and_identical?` (`vendor/thor/v1.3.2/spec/actions/directory_spec.rb:28-36`)
calls `FileUtils.identical?(source, destination)`, an alias of `FileUtils.compare_file`
(`vendor/ruby/v3.3.11/lib/fileutils.rb`, `compare_file` / `identical?` / `cmp`). ruby-compat's
`FileUtils` (`packages/ruby-compat/src/file-utils.ts`) has no `compare_file`, so
`packages/thor/src/actions/directory.test.ts` (trails#9464) compares `File.read` contents instead.

## Acceptance criteria

- [ ] ruby-compat ports `FileUtils.compare_file` (async twin `compareFileAsync` where async fs is required)
      with its `identical?` / `cmp` aliases, as in `fileutils.rb`: size check, then a chunked byte compare.
- [ ] `directory.test.ts`'s `isExistsAndIdentical` calls `FileUtils.isIdentical(source, destination)`, as Thor does.
