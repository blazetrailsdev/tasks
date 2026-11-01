---
title: "notes-and-stats-output-is-printed-by-extractor-and-code-statistics"
status: ready
updated: 2026-11-01
rfc: "0171-thor-port"
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

`Rails::SourceAnnotationExtractor.enumerate` / `#display` print with `puts` (`vendor/rails/v8.0.2/railties/lib/rails/source_annotation_extractor.rb`), and `CodeStatistics#to_s` prints through `print_header` / `print_line` (`vendor/rails/v8.0.2/railties/lib/rails/code_statistics.rb:64-76`). In trails `packages/trailties/src/source-annotation-extractor.ts` `enumerate` / `display` and `code-statistics.ts` `toString` return a string, so `NotesCommand#displayAnnotations` and `StatsCommand#perform` carry an invented `stdout.write`. `CodeStatistics.create` also stands in for `new` because the walk is async.

## Acceptance criteria

- [ ] `enumerate` / `display` and the statistics printers write to stdout as Rails does, and their tests capture output.
- [ ] The `@inventedArm write` receipts in `commands/notes.ts` and `commands/stats.ts` are removed.
