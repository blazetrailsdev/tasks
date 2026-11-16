---
title: "vite ports read package.json versions, not Gem.loadedSpecs"
status: draft
updated: 2026-11-16
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Gem.loadedSpecs` (`packages/ruby-compat/lib/gem.ts`) is always empty in
Node: RubyGems is not ported (CLAUDE.md "RubyGems is not ported"). Three
vite ports still read it, so each always takes its absent arm:

- `packages/vite-assets/lib/vite-assets.ts` `frameworkLibraries` (mirrors
  `ViteRuby.framework_libraries`, `Gem.loaded_specs[name]`): never answers
  a library, so `bin/vite info` lists no companion packages.
- `packages/vite-assets/lib/commands.ts` `printInfo`
  (`Gem.loaded_specs[framework]&.version`): always prints an empty version.
- `packages/vite-trails/lib/tasks/vite.ts` (`if Gem.loaded_specs['rails']`):
  `vite:verify_install` is never enhanced with `environment`.

trails#10207 converged the same shape in et-orbi (`tzinfoVersion` /
`tzinfoDataVersion`) by reading the corresponding trails package's own
`package.json` through `createRequire(import.meta.url)(...)`, keeping the
Ruby names and the absent arm for a package that is not installed.

## Acceptance criteria

- Each of the three sites reads the corresponding `@blazetrails/*` package's
  `package.json` (name and `version`), answering the Ruby absent arm when the
  package cannot be resolved; none reads `Gem.loadedSpecs`.
- Ruby method names and control flow unchanged.
- Tests assert `frameworkLibraries` answers an installed companion package
  and `printInfo` prints its version.
