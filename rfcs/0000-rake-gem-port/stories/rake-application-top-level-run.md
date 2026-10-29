---
title: "Port Rake::Application#run, top_level and error display"
status: draft
updated: 2026-10-29
rfc: "0000-rake-gem-port"
cluster: port
packages: [rake]
deps: [rake-application-options-and-loading]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The second half of `vendor/rake/v13.2.1/lib/rake/application.rb`: `run`, `top_level`, `invoke_task`, `parse_task_string`, `standard_exception_handling`, `display_error_message`, `display_tasks_and_comments` (`-T`, `-D`, `-W`, `-P`), plus `trace_output.rb`, `backtrace.rb`, `pseudo_status.rb` and `cloneable.rb`. `top_level` awaits each task (rake RFC § "Task actions and `invoke` are async").

## Acceptance criteria

- [ ] Ported at the Ruby paths and names; `invoke_task("name[a,b]")` parses arguments as `parse_task_string` does.
- [ ] Error display and exit status match Ruby; `--trace` and `Backtrace.collapse` filter frames by rake's rules over Node stack frames.
- [ ] The remaining arms of `test/test_rake_application.rb`, plus `test_rake_top_level_functions.rb`, `test_rake_backtrace.rb`, `test_trace_output.rb` port with verbatim names.
