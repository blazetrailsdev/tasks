---
title: "vite-assets-require-framework-libraries-loads-vite-trails"
status: in-progress
updated: 2026-11-16
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10209
claim: "2026-11-16T21:28:22Z"
assignee: "vite-assets-require-framework-libraries-loads-vite-trails"
blocked-by: null
closed-reason: null
---

## Context

`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli.rb:20-29` (`require_framework_libraries`) loads `<library>/cli` for each companion library that is installed. Its port, `packages/vite-assets/lib/cli.ts` (`requireFrameworkLibraries`), finds them through `ViteAssets.frameworkLibraries` (`packages/vite-assets/lib/vite-assets.ts:64-69`), which reads `Gem.loadedSpecs`. That record is always empty in Node (`packages/ruby-compat/lib/gem.ts:83-89`; RubyGems is not ported, trails#10021), and `COMPANION_LIBRARIES` is keyed by Ruby library names (`vite_rails`) that are not npm package names. So `bin/vite install` / `bin/vite build` in a trails app never load `@blazetrails/vite-trails/cli.js`, and the `ViteTrails::CLI::Install` / `Build` prepends from trails#10200 do not apply.

In trails the question "is this companion library installed" is answered by the app's `package.json` dependencies and npm package resolution, not by a loaded-library table. `commands.ts:107` (`Gem.loadedSpecs[framework]?.version`) reads the same empty record for the framework package's version.

## Acceptance criteria

- `frameworkLibraries` finds companion packages from the app's `package.json` dependencies (resolving each package's own `package.json` for `name` / `version`), keyed by npm package name (`@blazetrails/vite-trails` → `trails`), with the name mapping receipted. No read of `Gem.loadedSpecs`.
- `requireFrameworkLibraries("cli")` imports `@blazetrails/vite-trails/cli.js` when the app depends on `@blazetrails/vite-trails`.
- `commands.ts`' version printout reads the framework package's `package.json` version.
- A test shows `ViteAssets.CLI.Install` carrying the vite-trails overrides after `requireFrameworkLibraries("cli")`.
