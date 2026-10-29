---
title: "Port Rake::DSL, FileTask, FileCreationTask, MultiTask"
status: draft
updated: 2026-10-29
rfc: "0000-rake-gem-port"
cluster: port
packages: [rake]
deps: [rake-task-manager-and-scope]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rake/v13.2.1/lib/rake/dsl_definition.rb` (`task`, `file`, `directory`, `multitask`, `namespace`, `rule`, `desc`, `import`), `file_task.rb`, `file_creation_task.rb`, `early_time.rb`, `late_time.rb`, `multi_task.rb`, `phony.rb`, `tasklib.rb`. `MultiTask#invoke_prerequisites` awaits its prerequisites together with no thread pool (rake RFC § "`multitask` without a thread pool"). `DSL` is a plain-object module (CLAUDE.md § "A Ruby module is a JS object or a JS class").

## Acceptance criteria

- [ ] Ported at the Ruby paths and names; a file task is needed when its file is missing or older than a prerequisite (`needed?`, `timestamp`).
- [ ] `multitask` prerequisites run concurrently and each still runs once.
- [ ] `test/test_rake_dsl.rb`, `test_rake_file_task.rb`, `test_rake_file_creation_task.rb`, `test_rake_directory_task.rb`, `test_rake_multi_task.rb`, `test_rake_early_time.rb`, `test_rake_late_time.rb`, `test_rake_definitions.rb` port as native Vitest (`expect` and `@blazetrails/vitest-matchers`, per the rake RFC § "Tests are native Vitest"), names matching for `parity:test`.
