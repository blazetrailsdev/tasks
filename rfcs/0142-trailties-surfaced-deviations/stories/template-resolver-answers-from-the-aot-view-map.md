---
title: "The template resolver answers from the trails build view map, not app/views or .tse sources"
status: done
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["actionview", "trails-tsc"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10315
claim: "2026-11-18T20:36:32Z"
assignee: "template-resolver-answers-from-the-aot-view-map"
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
