---
title: "Port Module#rake_extension, PrivateReader and FileList#to_s / each_dir_parent / from_pathname, with their tests"
status: draft
updated: 2026-11-09
rfc: "0000-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api`: `ext/core.rb` 0/1 (`Module#rake_extension`, no TS file),
`private_reader.rb` 0/1 (`PrivateReader#private_reader`), `file_list.rb`
`FileList#to_s`, `Rake.each_dir_parent`, `Rake.from_pathname`
(`vendor/rake/v13.2.1/lib/rake/file_list.rb`). `pnpm parity:test`: `test_rake_extension.rb` (3,
`rake_extension`) and `test_rake_reduce_compat.rb` (1) are unported.

## Acceptance criteria

- [ ] The five members are ported at their Ruby names and files.
- [ ] `test_rake_extension.rb` and `test_rake_reduce_compat.rb` are ported by name.
