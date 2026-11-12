---
title: "Port the vite:* rake tasks and the assets:precompile enhancement"
status: draft
updated: 2026-11-12
rfc: "0000-vite-assets-port"
cluster: vite-assets
packages: [vite-assets]
deps: [vite-assets-cli-and-binstub]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_ruby/lib/tasks/vite.rake:7-95` defines
`vite:binstubs`, `build`, `build_ssr`, `build_all`, `clobber`,
`verify_install`, `install_dependencies` and `info`, and enhances
`assets:precompile` at `:57-72`. `ViteRuby.install_tasks` loads it. Test:
`vendor/vite_ruby/v3.11.1/test/rake_tasks_test.rb`.

## Acceptance criteria

- Each task registers through `@blazetrails/rake` under its Rails name, and
  calls the same `ViteRuby` / CLI entry points as the Ruby.
- The `assets:precompile` enhancement takes the same `:57-72` branches.
- `rake_tasks_test.rb` is ported under its upstream names.
