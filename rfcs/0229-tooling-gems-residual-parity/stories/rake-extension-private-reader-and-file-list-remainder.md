---
title: "Port Module#rake_extension and FileList#to_s, and move each_dir_parent / from_pathname into file_list's file"
status: in-progress
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps:
  - mail-parity-api-credits-object-literal-modules
deps-rfc: []
est-loc: 150
priority: 2
pr: trails#9957
claim: "2026-11-10T16:14:13Z"
assignee: "rake-extension-private-reader-and-file-list-remainder"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api`: `ext/core.rb` 0/1 (`Module#rake_extension`, no TS file) and
`FileList#to_s` (`vendor/rake/v13.2.1/lib/rake/file_list.rb`) are unported. `Rake.each_dir_parent`
and `Rake.from_pathname` are ported, but in `packages/rake/lib/rake-module.ts:67`
rather than `file-list.ts`, where Ruby defines them (`file_list.rb`'s
`class << self` on `Rake`). `PrivateReader#private_reader` exists in
`private-reader.ts`'s `ClassMethods` object literal, so it is credited by
`mail-parity-api-credits-object-literal-modules`. `pnpm parity:test`:
`test_rake_extension.rb` (3) and `test_rake_reduce_compat.rb` (1) are unported.

## Acceptance criteria

- [ ] `rake_extension` and `FileList#toString` are ported at their Ruby files.
- [ ] `eachDirParent` / `fromPathname` move to `file-list.ts`, with their importers
      updated.
- [ ] `test_rake_extension.rb` and `test_rake_reduce_compat.rb` are ported by name.
