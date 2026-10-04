---
title: "trailties: production serves nothing from app/assets, there is no assets precompile"
status: draft
updated: 2026-10-04
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap#32 (trails pin `9e17ddc98d`). `trails server` mounts Vite only in development
(`packages/trailties/src/commands/server.ts:33`, since trails#8077); in any other environment it runs
`Handler.Node` over the application alone. Nothing then serves `app/assets`: the generated layout's
`/assets/stylesheets/application.css` is a 404 and the page renders unstyled. There is no command
that puts assets where the static middleware looks.

Rails: `bin/rails assets:precompile` (propshaft/sprockets) writes digested files under
`public/assets`, the generated Dockerfile runs it (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/Dockerfile.tt`,
`RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile`), and `stylesheet_link_tag` resolves the
digested path.

The application workaround, which is the finding: trailmap's Dockerfile copies `app/assets` to
`public/assets` by hand and the layout hard-codes the undigested URL. `no-static-or-asset-pipeline`
(done) added static serving of `public/`, not a build step. Related:
`generated-vite-outdir-nested-in-publicdir`, `generated-vite-config-makes-root-unreachable`.

## Expected shape

A `trails assets precompile` (over the generated `vite build`, which already has `manifest: true`
and `outDir: public/assets`), run by the generated Dockerfile, with the asset tag helpers resolving
through the manifest in production.

## Acceptance criteria

- [ ] A freshly generated application, built from its generated Dockerfile and run with `NODE_ENV=production`, serves its stylesheet with a 200.
- [ ] `stylesheetLinkTag("application")` emits the precompiled path in production and the Vite path in development.
