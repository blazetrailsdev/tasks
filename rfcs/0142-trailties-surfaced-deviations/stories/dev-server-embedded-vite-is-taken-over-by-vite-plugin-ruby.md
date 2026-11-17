---
title: "The development server embeds the app's Vite config, so vite-plugin-ruby takes over its port and base"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "vite-trails"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails' development server embeds Vite (`packages/trailties/lib/server/dev-server.ts`, `server/vite-plugin.ts`) and loads the app's `vite.config.ts`. An app that adopts vite-trails, the port of `vite_rails`, adds `vite-plugin-ruby` to that config, as `vite_ruby` requires. The plugin's `config()` hook then sets Vite's `server.port` (3036 from `config/vite.json`) and `base` (`/vite-dev/`). The embedded server binds there instead of `-p`, and every app route answers "did you mean /vite-dev/…". Found in trailmap#151, whose `vite.config.ts` applies the plugin to builds only as a workaround (`apply: "build"`), so development has no HMR and builds on demand.

Rails: `vite_rails` runs the Vite dev server as a process of its own (`bin/vite dev`), and the Rails server proxies to it (`ViteRuby::DevServerProxy`). The two never share a port or base.

## Expected shape

When vite-trails is installed, trails' development server does not embed the app's Vite config as its HTTP server. Either it runs the Vite dev server separately and proxies through `vite-assets`' `DevServerProxy`, as vite_rails does, or it strips the plugin's server settings.

## Acceptance criteria

- An app with vite-trails and `vite-plugin-ruby` in `vite.config.ts` serves its pages on `-p` in development, with HMR through the proxy.

- trailmap can drop `apply: "build"` from its vite.config.ts.
