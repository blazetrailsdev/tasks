---
title: "app-builder-bodies-use-rails-file-actions"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
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

`AppBuilder` in `packages/trailties/src/generators/rails/app/app-generator.ts` holds
the bodies of `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:45-280`,
but they still write inline with `createFile` where Rails calls `template`,
`directory`, `copy_file`, `empty_directory`, `empty_directory_with_keep_file`,
`keep_file`, `inside`, `chmod` and `shebang`. Each omission carries a
`@missingRailsCall ... — CONVERGEABLE app-builder-bodies-use-rails-file-actions` receipt.

## Acceptance criteria

- The file content moves to `rails/app/templates/`, and each body makes the Rails calls.
- `.gitkeep` files become `.keep` through `empty_directory_with_keep_file`, with the `.gitignore` entries.
- Every receipt naming this story is removed.
