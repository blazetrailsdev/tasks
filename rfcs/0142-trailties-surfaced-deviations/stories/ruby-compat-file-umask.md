---
title: "ruby-compat-file-umask"
status: draft
updated: 2026-11-01
rfc: "0142-trailties-surfaced-deviations"
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

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/plugin_generator.rb:186` reads `File.umask`
for `bin`'s mode. ruby-compat's `File` has no `umask`, so `PluginBuilder#bin` in
`packages/trailties/src/generators/rails/plugin/plugin-generator.ts` passes `0o755` unmasked.

## Acceptance criteria

- `File.umask` is ported in ruby-compat through the process adapter (MRI `rb_file_s_umask`).
- `PluginBuilder#bin` calls `0o755 & ~File.umask()` and its `@missingRailsCall umask` receipt is removed.
