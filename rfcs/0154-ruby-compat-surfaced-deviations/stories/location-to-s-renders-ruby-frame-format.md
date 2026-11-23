---
title: "location-to-s-renders-ruby-frame-format"
status: draft
updated: 2026-11-23
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

Ruby's `Thread::Backtrace::Location#to_s` renders `path:lineno:in 'label'`
(`vendor/ruby/v3.3.11/vm_backtrace.c`, `location_to_str`), so a Rails
`suppress_backtrace_pattern` anchored at the path works:
`RakeCommand#non_app_file_pattern` is `/\A(?!#{Regexp.quote Rails::Command.root.to_s})/`
(`vendor/rails/v8.0.5.2/railties/lib/rails/commands/rake/rake_command.rb:32-34`), and
`rake_test.rb`'s "task backtrace is silenced" (`railties/test/application/rake_test.rb:55-68`)
greps `/:\d+:in /` and partitions on `line.start_with?(app_path)`.

ruby-compat's `Location#toString` (`packages/ruby-compat/lib/backtrace-location.ts:69-71`)
returns the raw V8 frame (`at fn (file:///path:1:2)`, indented), so `excBacktrace` lines never
start with a path. Under the faithful pattern every frame, app frames included, is
suppressed, and `packages/trailties/test/application/rake.test.ts` "task backtrace is
silenced" is parked `BLOCKED:` this story.

## Acceptance criteria

- [ ] `Location#toString` renders Ruby's `path:lineno:in 'label'` form from the V8 frame (path without `file://`), and `excBacktrace` returns those strings.
- [ ] `RakeCommand.nonAppFilePattern` stays Rails' `^(?!root)` and the app frames of a failing rake task survive suppression.
- [ ] The `BLOCKED:` skip on "task backtrace is silenced" is removed; its test greps `/:\d+:in /` as Rails does.
