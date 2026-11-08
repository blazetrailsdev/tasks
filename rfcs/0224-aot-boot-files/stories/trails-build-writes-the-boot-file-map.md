---
title: "trails build writes .trails/boot.generated.js and the entry installs it"
status: draft
updated: 2026-11-08
rfc: "0224-aot-boot-files"
cluster: null
packages: ["trails-tsc"]
deps: ["boot-sites-load-through-kernel-load"]
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0224. trails#9850 writes `.trails/autoload/install.generated.js` and
`.trails/entry.generated.js`. The boot files still need a map.

## Change

`trails build` (`packages/trails-tsc/lib/build-autoload.ts`) reads the same path
config the boot uses: `paths["config/routes"]`, `config/routes/*`,
`config/environments`, `config/initializers`, `db/seeds.ts`, the helpers'
paths, and those of every engine. From them it writes
`.trails/boot.generated.js`, which calls `registerCompiledFiles` with literal
`() => import(...)` thunks. The install module imports it.

## Acceptance

- Covered in `build-autoload.trails.test.ts`: the file lists routes,
  environments, initializers and seeds for an application.
- Booting through the entry under Node registers every listed file before
  `Trails.initialize()` loads the routes.
