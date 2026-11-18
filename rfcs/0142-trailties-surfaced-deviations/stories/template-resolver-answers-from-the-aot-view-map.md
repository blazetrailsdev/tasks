---
title: "The template resolver answers from the trails build view map, not app/views or .tse sources"
status: ready
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["actionview", "trails-tsc"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A bundled production boot still reads views from disk even after
`trails build` lists `.trails/views/**/*.js` in the AOT file map and `templateCompiler`
loads them from it (`packages/actionview/lib/template.ts`, `packages/trails-tsc/lib/build-autoload.ts`,
serverless spike branch `serverless-spike-12077e`). The template resolver globs `app/views/**` and
reads the `.tse` source, and the Rails path checks stat `app/` and `config/`. A deploy must therefore ship
`app/` and `config/` beside the bundle, which blocks any runtime without a filesystem
(Cloudflare Workers). See the spike report's B5.

## Acceptance criteria

- With a `trails build` boot map registered, the template resolver answers template lookup
  from the build's list of compiled views, and does not read a `.tse` source for a template
  that has a compiled module.
- A test boots from the compiled map with `app/views` absent and renders a view.
- An fs trace of a bundled boot plus first request shows no reads under `app/views`.
