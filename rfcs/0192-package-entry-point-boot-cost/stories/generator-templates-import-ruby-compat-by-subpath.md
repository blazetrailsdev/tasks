---
title: "trailties: generator templates import ruby-compat by subpath"
status: in-progress
updated: 2026-11-27
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10844
claim: "2026-11-27T16:14:48Z"
assignee: "generator-templates-import-ruby-compat-by-subpath"
blocked-by: null
closed-reason: null
---

## Context

trails#10826 moved trailties' own ruby-compat barrel imports to subpaths, but the code the generators write into a user's app still imports the full barrel `@blazetrails/ruby-compat`, so every generated app pays the 139-module barrel at boot:

- `packages/trailties/lib/generators/trails/app/templates/config/application.ts.tt:3` (`Bundler, constSet, TopLevel`)
- `.../app/templates/config/environments/{production,development,test}.ts.tt:2,2,7` (`env`, `STDOUT`, `getFs`)
- `.../app/templates/test/{test-helper,global-setup}.ts.tt` (`env, setEnv`)
- `.../app/templates/config/initializers/cors.ts.tt:11` (commented `block`)
- `.../plugin/templates/bin/trails.tt:3`, `plugin/templates/Rakefile.ts.tt:2`, `plugin/templates/test/test_helper.ts.tt:7` (dynamic `import(...)`)
- `.../test-unit/controller/templates/functional_test.ts.tt:3`
- `.../test-unit/scaffold/templates.ts:33` (preamble string)

## Acceptance criteria

- [ ] Every generator template imports each binding from its owning subpath (`scripts/boot-graph/scc-map.json` gives the owner)
- [ ] Generator tests asserting the rendered import text are updated to match
- [ ] `grep -rn '"@blazetrails/ruby-compat"' packages/trailties/lib/generators` returns 0
