---
title: "app-generator-create-files-go-through-build"
status: blocked
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-01T13:37:46Z"
assignee: "app-generator-create-files-go-through-build"
blocked-by: "waiting on trails#9565 (trailties-relocate-app-generator-to-rails-path): the rails/app/app-generator.ts path and its 19 baseline rows exist only there. Moving ~1100 lines of bodies onto AppBuilder also exceeds one 800 LOC PR alone, so it needs its own PR after #9565 merges, not a bundle with mail-address-spec."
closed-reason: null
---

## Context

Moving `AppGenerator` to `packages/trailties/src/generators/rails/app/app-generator.ts`
made parity:api compare its bodies with
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb` for
the first time. Each `create_*_files` method there (`:368-370` onward) is
`build(:name)`, dispatching to `AppBuilder` through `AppBase#build`
(`generators/app_base.rb:170-172`). The port writes the files inline, so 16 methods
omit `build`; `rubocop` and `system_test` omit `template`, and `system_test`
omits `empty_directory_with_keep_file`; `database_yml` calls `template` with
different arguments. They are baselined in
`scripts/api-compare/call-mismatches-exclude/trailties/generators/rails/app/app-generator.json`.

## Acceptance criteria

- Each `create_*_files` body is `build(...)`, with its body on `AppBuilder`, and
  `AppBase#build` ported.
- `rubocop`, `system_test` and `database_yml` make the Rails calls.
- All 19 baseline rows in that file are deleted and the file removed.
