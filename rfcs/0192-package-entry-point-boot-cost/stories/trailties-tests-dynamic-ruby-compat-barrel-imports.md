---
title: "trailties tests: dynamic ruby-compat barrel imports onto owning subpaths"
status: done
updated: 2026-11-26
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10819
claim: "2026-11-26T21:14:45Z"
assignee: "migrate-activerecord-test-models-and-support-off-the-ruby-compat-barrel"
blocked-by: null
closed-reason: null
---

## Context

trails#10804 moved every static `from "@blazetrails/ruby-compat"` import in `packages/trailties/test` onto owning subpaths, but dynamic barrel imports that run as test code (not inside generated-app template strings) remain, e.g.:

- `packages/trailties/test/command.trails.test.ts:135` `const { Dir, File, FileUtils, LOAD_PATH } = await import("@blazetrails/ruby-compat")` and `:164` (adds `LoadError`, `registerCompiledFiles`)
- `packages/trailties/test/autoloaders/inflector-subpath.trails.test.ts:18` (inside a `node -e` script, checks the subpath alone; verify it should stay)

## Acceptance criteria

- [ ] Each dynamic barrel import executed as test code imports the owning subpath per `scripts/boot-graph/scc-map.json`
- [ ] Ones inside generated-app template strings are left unchanged
- [ ] Touched tests pass
