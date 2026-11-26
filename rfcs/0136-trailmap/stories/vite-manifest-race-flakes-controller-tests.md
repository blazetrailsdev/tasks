---
title: "Full test runs flake on an empty Vite manifest"
status: ready
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A full `pnpm test` run fails a varying set of controller tests (4 to 20 per run, seen on trailmap#196 and #197) with
`ActionView::Template::Error: Vite Ruby can't find javascripts/rfc-actions.js in the manifests`
(also rfc-sort.js, stylesheets/application.css). The serialized error shows `lastBuild.success: true` but `manifest: {}`, with `autoBuild: true` and `publicOutputDir: vite-test`. The same files pass when run alone.

This looks like parallel vitest workers racing on vite autoBuild / reading `public/vite-test/.vite/manifest.json` while another worker rewrites it. If the race is inside the vendored `@blazetrails` vite port (autoBuild writing the manifest non-atomically), it is a framework bug: reproduce and fix in trails, then close this story.

## Acceptance criteria

1. Root cause identified (trailmap test setup vs trails vite port), and a trails story filed if it is the framework.
2. Three consecutive full `pnpm test` runs show no MissingEntrypointError.
