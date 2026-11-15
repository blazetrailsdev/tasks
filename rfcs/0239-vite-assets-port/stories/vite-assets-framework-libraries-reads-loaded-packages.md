---
title: "vite-assets-framework-libraries-reads-loaded-packages"
status: in-progress
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10144
claim: "2026-11-15T19:23:19Z"
assignee: "dev-server-proxy-streaming-default-in-constructor"
blocked-by: null
closed-reason: null
---

## Context

Two gaps in `packages/vite-assets/lib`:

- `Commands#print_info` (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/commands.rb:79-104`) loops over `ViteRuby.framework_libraries` (`vite_ruby.rb:58-64`), which reads `Gem.loaded_specs`. trails has neither of these, so the loop is left out of `commands.ts` and carries `@missingRailsCall framework_libraries`.
- `Runner#run`'s `Kernel.exec(*cmd)` (`runner.rb:12`) passes the env hash first. ruby-compat's `exec` (`packages/ruby-compat/lib/process-adapter.ts:625`) takes only argv, so `runner.ts` drops the env and carries `@missingRailsArgs exec`.

## Acceptance criteria

- `ViteAssets.frameworkLibraries` is ported. It reads the installed companion npm packages (`@blazetrails/vite-trails`, …) against `COMPANION_LIBRARIES`, and `printInfo` runs the loop.
- ruby-compat's `exec` accepts a leading env hash through `rbExecargNew`, and `Runner#run` passes `cmd` whole. Both receipts are removed.
