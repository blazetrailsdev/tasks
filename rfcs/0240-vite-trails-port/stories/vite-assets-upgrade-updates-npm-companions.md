---
title: "vite-assets-upgrade-updates-npm-companions"
status: in-progress
updated: 2026-11-16
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: trails#10218
claim: "2026-11-16T23:42:05Z"
assignee: "vite-trails-entry-first-import-hangs"
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli/upgrade.rb` `upgrade_ruby_gems` runs `bundle update --conservative vite_ruby <framework gems>`. Its port, `packages/vite-assets/lib/cli/upgrade.ts` (`upgradeRubyGems`), builds the same command from `ViteAssets.frameworkLibraries()`. Since trails#10209 those are npm packages (`@blazetrails/vite-trails`), so the command names npm packages to bundler. A trails app has no Gemfile at all, so `bundle update` cannot succeed in either form.

## Acceptance criteria

- `bin/vite upgrade` in a trails app updates `@blazetrails/vite-assets` and the companion packages through the app's package manager (`config.packageManager`). The deviation is receipted at the call site.
- `upgrade.test.ts` asserts the real command for npm companion names.
