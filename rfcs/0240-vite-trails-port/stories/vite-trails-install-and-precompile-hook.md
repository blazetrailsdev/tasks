---
title: "Port ViteTrails::CLI (vite:install for Rails) and the assets:precompile hook"
status: draft
updated: 2026-11-12
rfc: "0240-vite-trails-port"
cluster: vite-trails
packages: [vite-trails]
deps: [vite-trails-package-and-tag-helpers, vite-assets-cli-and-binstub, vite-assets-rake-tasks]
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

`vendor/vite_ruby/v3.11.1/vite_rails/lib/vite_rails/cli.rb:5-84` defines `ViteRails::CLI::Build`
(`ensure_rails_init`, `:15`) and `ViteRails::CLI::Install`, which prepends
onto the core install. It covers `setup_app_files` (`:28`),
`setup_content_security_policy` (`:38`) and `install_sample_files` (`:60`).
`vite_rails/lib/tasks/vite.rake:1-5` calls `ViteRuby.install_tasks` and
enhances `vite:verify_install` with `:environment`. Test:
`vendor/vite_ruby/v3.11.1/test/engine_rake_tasks_test.rb`.

## Acceptance criteria

- `trails vite:install` in a generated app writes `config/vite.json`,
  `vite.config.ts` and the sample entrypoint from the gem's templates, and
  edits the CSP initializer as `setup_content_security_policy` does.
- `assets:precompile` runs `vite:build_all`, through the
  `vite_ruby/lib/tasks/vite.rake:57-72` branches.
- `engine_rake_tasks_test.rb` is ported.
