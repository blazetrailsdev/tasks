---
title: "CI runs a generated app's vitest suite against packed packages, where trails' source aliases hide module-graph defects"
status: done
updated: 2026-11-04
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: ["trailties", "zeitwerk"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9687
claim: "2026-11-03T22:48:22Z"
assignee: "generated-app-vitest-suite-runs-against-packed-packages"
blocked-by: null
closed-reason: null
---

## Context

trails' vitest config aliases every `@blazetrails/*` package to its source
(vitest.config.ts, the alias table near :357), so every package runs inside
vite's module graph in trails' own suite. An application consumes the packed
packages, which vitest externalizes, so their own `import()` is Node's. A
defect that exists only on that path cannot fail any trails test:
zeitwerk-seats-a-second-module-instance-under-vitest (trails#9683) seated a
second module instance of every app class under vitest, and was found by
trailmap, not by trails. application-cannot-boot-under-vitest-because-initializers-import-natively
is the same class of defect, found the same way.

## Expected

A CI job packs the packages (as trailmap's scripts/vendor-trails.sh does),
generates an app with `trails new` against the tarballs, adds a model with an
association, and runs the generated app's own vitest suite: boot in-process,
`TopLevel.<Model>` is the class the test imported, an association query works.
