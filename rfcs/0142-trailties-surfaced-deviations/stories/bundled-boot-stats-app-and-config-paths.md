---
title: "A bundled boot answers Rails path existence from the build map, not stats of app/ and config/"
status: draft
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10315 made the template resolver answer from the `trails build` boot map
(`packages/trails-tsc/lib/build-autoload.ts` `viewEntries`,
`packages/actionview/lib/template/resolver.ts` `templateGlob`). The spike report's
B5 also names the Rails path checks that stat `app/` and `config/` during a bundled
boot (engine/application `paths` `existent()` walks in `packages/trailties/lib/engine.ts`
and `engine/configuration.ts`). They mirror `Rails::Paths::Path#existent`
(`vendor/rails/v8.0.2/railties/lib/rails/paths.rb:203-207`), which does `File.exist?` on disk.
A bundled boot with no `app/` or `config/` beside it (Cloudflare Workers) still reaches the filesystem.

## Acceptance criteria

- With a boot map registered, `Paths::Path#existent` / `existent_directories`
  answer a path the map holds compiled files under without a stat, keeping Rails'
  method names and call sites.
- A test boots from the compiled map with `app/` and `config/` absent.
