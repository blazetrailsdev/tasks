---
title: "Rails::Command::Behavior.lookup/lookup! scan the load path instead of a hand LOAD_PATH table"
status: claimed
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: null
claim: "2026-11-09T19:35:25Z"
assignee: "command-behavior-lookup-scans-load-path"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::Behavior.lookup` / `lookup!` (`vendor/rails/v8.0.2/railties/lib/rails/command/behavior.rb:39-65`) find command files by searching `$LOAD_PATH`. `lookup!` globs `Dir[File.join(base, *file_lookup_paths)]` (`{rails/commands,commands}/**/*_command.rb`, `command.rb:161-163`), strips the prefix with `delete_prefix`, and `require`s each match inside `rescue Exception`. `lookup` requires `"#{base}/#{path}"` for each `namespaces_to_paths` candidate.

trailties' `packages/trailties/lib/command/behavior.ts` uses a hand-written `LOAD_PATH` table instead, mapping a path to an `import()`. `lookup` and `lookupBang` iterate that table, and `lookup` carries `@inventedArm if — PERMANENT`. A command defined by an app or engine (`lib/commands/*_command.ts`) cannot be found.

## Acceptance criteria

- [ ] `lookup` / `lookupBang` resolve command files from a load-path list (`lookupPaths`, `fileLookupPaths` at their Rails names), with the Rails glob and `delete_prefix` shape, using async fs and `import()`.
- [ ] An app-defined `lib/commands/foo/foo-command.ts` is found by `findByNamespace("foo")`, with a test.
- [ ] The hand `LOAD_PATH` table and `lookup`'s `@inventedArm if` receipt are gone.
