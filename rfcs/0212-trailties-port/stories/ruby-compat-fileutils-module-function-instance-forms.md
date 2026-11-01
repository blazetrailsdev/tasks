---
title: "ruby-compat-fileutils-module-function-instance-forms"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9585
claim: "2026-11-01T19:46:39Z"
assignee: "ruby-compat-fileutils-module-function-instance-forms"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::TestCase` does `include FileUtils` (`vendor/rails/v8.0.2/railties/lib/rails/generators/test_case.rb:34`), and `Testing::Behavior` calls `cd`, `rm_rf` and `mkdir_p` on self (`behavior.rb:100-105`). ruby-compat's `FileUtils` (`packages/ruby-compat/src/file-utils.ts`) is statics only, so `include()` has nothing to copy. Ruby's `module_function` gives both forms.

## Acceptance criteria

- `FileUtils` is a class module with instance forms of its `module_function` methods.
- `packages/trailties/src/generators/test-case.ts` calls `include(TestCase, FileUtils)` and its `@missingRailsCall include` receipt is removed.
- `Behavior` calls `this.cd`, `this.rmRf` and `this.mkdirP`.
