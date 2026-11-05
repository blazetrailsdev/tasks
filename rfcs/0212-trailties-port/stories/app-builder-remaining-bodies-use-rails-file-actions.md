---
title: "app-builder-remaining-bodies-use-rails-file-actions"
status: in-progress
updated: 2026-11-05
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9735
claim: "2026-11-05T12:10:03Z"
assignee: "move-app-template-command-onto-framework-rake-task"
blocked-by: null
closed-reason: null
---

## Context

Split from `app-builder-bodies-use-rails-file-actions`, which converted the keep-file
bodies (`lib`, `log`, `storage`, `tmp`, `vendor`, `test`'s keeps, `app`'s keeps) and the
small templates (`rakefile`, `gitignore`, `gitattributes`, `node_version`, `ruby_version`,
`db`). These `AppBuilder` bodies in
`packages/trailties/src/generators/trails/app/app-generator.ts` still write inline
with `createFile`, where
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:45-280`
calls the file actions: `readme` (copy_file, :50-52), `gemfile` (template, :62-64),
`configru` (template, :66-68), `dockerfiles` (template + chmod, :78-85), `app`
(directory "app", :107-114), `bin` (directory + shebang + chmod, :116-122),
`config` (empty_directory + inside + directory, :128-143), `public_directory`
(directory, :220-224), `test` (template "test/test_helper.rb", :240-249).
Moving the content to `templates/` roughly doubles the LOC (delete + add), so it
did not fit one PR.

## Acceptance criteria

- Each body above makes the Rails calls, with its content in `trails/app/templates/`.
- `rubyVersion` (`ruby_version`, :54-56, `template "ruby-version", ".ruby-version"`) is today a copy of `nodeVersion` writing `.node-version`, so `create_root_files` writes that file twice. Converge it, or get an owner ruling that a trails app has no `.ruby-version` and skip the method.
- Every `@missingRailsCall … CONVERGEABLE app-builder-remaining-bodies-use-rails-file-actions`
  receipt is removed.
