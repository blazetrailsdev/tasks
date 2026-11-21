---
title: "rb-f-caller-answers-mri-location-string"
status: draft
updated: 2026-11-21
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Kernel#caller` is ruby-compat's `rbFCaller`
(`packages/ruby-compat/lib/backtrace-location.ts:157-164`). Each element is
`Location#toString`, which returns the raw V8 frame line
(`at file:///…/lib/tasks/my-task.rake.ts?9:3:5`). MRI's `location_to_str`
(`vendor/ruby/v3.3.11/vm_backtrace.c:405`) formats `path:lineno:in 'label'`,
with `path` a filesystem path.

Rake's `TaskManager#find_location` records that string into
`task.locations` (`packages/rake/lib/task-manager.ts:268-287`). trailties'
`RakeCommand.printing_commands`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/rake/rake_command.rb:10-16`,
ported at `packages/trailties/lib/commands/rake.ts`) keeps a task only when a
location matches `non_app_file_pattern`, `\A(?!<Rails root>)`. Every V8 frame
starts with `at file://`, so app tasks pass and `bin/trails --help` lists
them.

The Rails test that shows it,
`vendor/rails/v8.0.2/railties/test/command/help_integration_test.rb:55-65`
("excludes application Rake tasks from command list via --help"), is not
ported in `packages/trailties/test/command/help-integration.test.ts` because it
fails on this.

## Acceptance criteria

- `rbFCaller` answers MRI's `path:lineno:in 'label'` shape with a filesystem
  path, as `location_to_str` does; `Location#toString` matches.
- Callers that parse the old V8 line (rake's `findLocation`, backtrace
  cleaners) are converged in the same PR.
- "excludes application Rake tasks from command list via --help" is ported
  in `packages/trailties/test/command/help-integration.test.ts` and passes.
