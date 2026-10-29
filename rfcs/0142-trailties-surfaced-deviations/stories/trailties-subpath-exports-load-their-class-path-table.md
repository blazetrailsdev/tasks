---
title: "trailties subpath exports load their class-path table"
status: draft
updated: 2026-10-29
rfc: "0142-trailties-surfaced-deviations"
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

A package's `class-paths.generated.ts` is imported only by its package entry (trailties: `packages/trailties/src/cli.ts:40`). A consumer importing a subpath export directly — `@blazetrails/trailties/autoloaders/inflector`, `/engine`, `/trailtie`, … (`packages/trailties/package.json` `exports`) — without loading the entry gets `rbModName(Klass)` null. Rails defines each as a named constant (e.g. `Rails::Autoloaders::Inflector`, `railties/lib/rails/autoloaders/inflector.rb:6-7`), so `name` is always set. Surfaced on trails#9419.

## Acceptance criteria

- Every trailties subpath export's module, imported alone as the built `dist/**.js` entry, answers `rbModName` with its Rails path (`Rails::Autoloaders::Inflector` for the inflector).
- The fix is the generated table reaching each subpath entry (each subpath module imports the table, or the table is split per subpath by the generator), with no hand-written `registerClassPaths` call.
- A plain-node import test of `dist/autoloaders/inflector.js` covers it.
