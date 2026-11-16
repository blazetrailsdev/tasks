---
title: "vite-assets-require-framework-libraries-loads-vite-trails"
status: ready
updated: 2026-11-16
rfc: "0240-vite-trails-port"
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

`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli.rb:20-29` (`require_framework_libraries`) requires `vite_rails/cli` for each companion gem in `Gem.loaded_specs`. Its port, `packages/vite-assets/lib/cli.ts` (`requireFrameworkLibraries`), reads `Gem.loadedSpecs` (`packages/vite-assets/lib/vite-assets.ts:64-69`, keyed `vite_rails`), but nothing in trails populates `Gem.loadedSpecs`. Even with a seat, `library.name.replaceAll("-", "/")` + `/cli` cannot resolve the npm package `@blazetrails/vite-trails`. So `bin/vite install` / `bin/vite build` in a trails app never load `@blazetrails/vite-trails/cli.js`, and the `ViteTrails::CLI::Install` / `Build` prepends from trails#10200 do not apply.

## Acceptance criteria

- `bin/vite` in an app depending on `@blazetrails/vite-trails` loads `@blazetrails/vite-trails/cli.js` through `requireFrameworkLibraries`, as `require_framework_libraries` does.
- The companion-library lookup is faithful to `COMPANION_LIBRARIES` / `framework_libraries` (vite_ruby.rb), with any npm-name mapping receipted.
- A test shows `ViteAssets.CLI.Install` carrying the vite-trails overrides after `requireFrameworkLibraries("cli")`.
