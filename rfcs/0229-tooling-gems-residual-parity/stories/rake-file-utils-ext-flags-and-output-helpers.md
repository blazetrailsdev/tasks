---
title: "Confirm Rake::FileUtilsExt's helpers are credited in it and its four includers once object-literal modules are credited"
status: in-progress
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps:
  - mail-parity-api-credits-object-literal-modules
deps-rfc: []
est-loc: 60
priority: 1
pr: trails#9958
claim: "2026-11-10T16:12:05Z"
assignee: "rake-file-utils-ext-flags-and-output-helpers"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (2026-11-09) misses `verbose`, `nowrite`, `when_writing`,
`rake_output_message`, `rake_check_options` in `file_utils_ext.rb` (7/16, plus
`verbose_flag(=)`, `nowrite_flag(=)`) and again in each file whose module mixes
in `FileUtilsExt`: `dsl_definition.rb`, `file_list.rb`, `tasklib.rb`,
`loaders/makefile.rb`. All nine exist in the `FileUtilsExt` object-literal module
(`packages/rake/lib/file-utils-ext.ts:60-101`), mixed in by `include(DSL,
FileUtilsExt)` / `extend(Rake, FileUtilsExt)` (`dsl-definition.ts:88-90`). This
is the extractor gap that `mail-parity-api-credits-object-literal-modules` (in
the mail-stack RFC) fixes for every package, not a port.

## Acceptance criteria

- [ ] After that story lands, `pnpm parity:api` credits the nine names in
      `file_utils_ext.rb` and the five mixed-in names in each of the four
      includers. Any includer row still missing is because it is not mixed in
      the Ruby way, and is fixed with `include()` / `extend()`.
