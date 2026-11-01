---
title: "app-generator-create-root-files-honors-skip-git"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9595
claim: "2026-11-01T22:46:37Z"
assignee: "app-generator-create-root-files-honors-skip-git"
blocked-by: null
closed-reason: null
---

## Context

`trails new --skip-git` still writes `.gitignore` and `.gitattributes`. Rails' `AppBuilder#gitignore` / `gitattributes` are reached through `build(:gitignore) unless options[:skip_git]` and `build(:gitattributes) unless options[:skip_git]` in `create_root_files` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb`); the option's desc at `app_base.rb` is "Skip git init, .gitignore and .gitattributes".

## Acceptance criteria

- `createRootFiles` writes neither file under `skipGit`, matching Rails' guards.
