---
title: "rake-file-list-port"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rake-dsl-and-file-tasks` ported `DSL#directory` (`packages/rake/src/dsl-definition.ts`) without the `arg.is_a?(FileList) ? arg.to_a.flatten : arg` arm of `vendor/rake/v13.2.1/lib/rake/dsl_definition.rb:95`, because `file_list.rb` is deferred to its first caller (RFC 0211 non-goals). That first caller is here: `test_can_use_filelist` (`vendor/rake/v13.2.1/test/test_rake_directory_task.rb`) is an `it.skip` in `packages/rake/src/test-rake-directory-task.test.ts`, and `check_tasks`' `FileList[]` (`test_rake_definitions.rb`) compares against `[]`. `each_dir_parent` and `from_pathname`, also defined in `file_list.rb:418-433`, already live in `rake-module.ts`.

## Acceptance criteria

- [ ] `Rake::FileList` is ported at `packages/rake/src/file-list.ts`, and `directory` takes its `is_a?(FileList)` arm.
- [ ] `can use filelist` runs, and `test_rake_file_list.rb` ports as native Vitest with matching names.
