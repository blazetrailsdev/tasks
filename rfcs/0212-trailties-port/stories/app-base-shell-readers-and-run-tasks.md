---
title: "app-base-shell-readers-and-run-tasks"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9569
claim: "2026-11-01T13:01:13Z"
assignee: "app-base-shell-readers-and-run-tasks"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/app-base.ts` holds the options, predicates, `imply_options` and Docker package lists of `vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb` after trailties-app-base-remaining-surface. These non-Bundler methods remain:

- Backtick readers, blocked by ruby-compat having no `` Kernel#` ``: `node_version` (:526), `dockerfile_yarn_version` (:536), `yarn_through_corepack?` (:542), `dockerfile_bun_version` (:547), `user_default_branch` (:780), `git_init_command` (:784).
- `dockerfile_binfile_fixups` (:553), `create_root` (:257; `AppGenerator#createRoot` is the invented stand-in, with no `empty_directory "."` or cd).
- `run_javascript`, `run_hotwire`, `run_css`, `run_solid` (:709-753), which need `rails_command` and `bundle_install?`.

`deduceImpliedOptions` inlines `TSort.tsort` (:178) because ruby-compat has no TSort.

## Acceptance criteria

- Each method above is ported at its Rails name in app-base.ts.
- `AppGenerator#createRoot` is removed in favour of the AppBase method.
- Bundler arms stay with RFC 0171's converge-generators-actions-gemfile-family-onto-package-json.
