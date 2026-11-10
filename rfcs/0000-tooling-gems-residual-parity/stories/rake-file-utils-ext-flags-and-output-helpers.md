---
title: "Port Rake::FileUtilsExt's verbose / nowrite / when_writing / rake_output_message / rake_check_options and the flag accessors"
status: draft
updated: 2026-11-09
rfc: "0000-tooling-gems-residual-parity"
cluster: null
packages:
  - "rake"
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (2026-11-09) misses `verbose`, `nowrite`, `when_writing`,
`rake_output_message`, `rake_check_options` in `file_utils_ext.rb` (7/16, plus
`verbose_flag(=)`, `nowrite_flag(=)`) and again in every file whose module
includes or extends `FileUtilsExt`: `dsl_definition.rb` (16/21), `file_list.rb`
(the `Rake#…` rows), `tasklib.rb` (16/21), `loaders/makefile.rb` (19/24).
Source: `vendor/rake/v13.2.1/lib/rake/file_utils_ext.rb:1-134`. Ported once in
`packages/rake/lib/file-utils-ext.ts` and mixed in by `include()` / `extend()`,
the includers are credited too.

## Acceptance criteria

- [ ] The nine members are ported at their Ruby names in `file-utils-ext.ts`.
- [ ] `DSL`, `FileList`, `TaskLib` and `MakefileLoader` get them through the
      Ruby `include` / `extend`, not a copy.
- [ ] `pnpm parity:api` shows the five files complete for these names.
