---
title: "Replace the two namespace imports of the ruby-compat barrel on the app boot path"
status: claimed
updated: 2026-11-25
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-25T23:29:45Z"
assignee: "migrate-activemodel-and-arel-tests-off-the-ruby-compat-barrel"
blocked-by: null
closed-reason: null
---

## Context

`scripts/boot-graph/measure.mts` (trails#10701) found two files loaded at the
`examples/serverless-lambda` boot that import the whole ruby-compat barrel by
namespace, so no per-binding subpath migration can shrink their cost:

- `packages/activerecord/lib/relation/spawn-methods.ts` — `import * as RubyCompat from "@blazetrails/ruby-compat"`
- `packages/rack-session/lib/cookie.ts:3` — namespace import of the barrel

`scripts/boot-graph/baseline.json` lists them in `wholeBarrelImports`. With them
replaced by named subpath imports, the ruby-compat union target is 180
(`rubyCompatTarget`) instead of 205 (`rubyCompatTargetWithWholeBarrelImports`).
The per-package migrate stories count named barrel imports; a
namespace-import codemod does not touch these.

## Acceptance criteria

- [ ] Both files import only the bindings they use, from the owning subpaths
      in `scripts/boot-graph/scc-map.json`
- [ ] `wholeBarrelImports` in `baseline.json` is empty after `--write`, and
      `rubyCompatTargetWithWholeBarrelImports` equals `rubyCompatTarget`
