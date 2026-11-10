---
title: "Port Module#rake_extension, PrivateReader, FileList#to_s / each_dir_parent / from_pathname and the remaining small rake tests"
status: draft
updated: 2026-11-09
rfc: "0000-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps: []
deps-rfc: []
est-loc: 300
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
(`vendor/rake/v13.2.1/lib/rake/file_list.rb`). `pnpm parity:test`: `test_rake_extension.rb` (3)
and `test_rake_reduce_compat.rb` (1) unported; `test_rake_file_list.rb` misses
"dup and clone replicate taint" (:500) and `test_rake_directory_task.rb` "directory
win32" (:37); `thread-history-display.test.ts` holds the 8
`test_thread_history_display.rb` tests at the wrong path
(`test-thread-history-display.test.ts`).

## Acceptance criteria

- [ ] The five members are ported at their Ruby names and files.
- [ ] `test_rake_extension.rb` and `test_rake_reduce_compat.rb` are ported by name.
- [ ] "dup and clone replicate taint" and "directory win32" are ported, or parked
      `PERMANENT-SKIP` citing the CLAUDE.md section that rules the arm out.
- [ ] `thread-history-display.test.ts` is `git mv`'d to the convention path;
      `pnpm parity:test --package rake` reports 0 misplaced.
