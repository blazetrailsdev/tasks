---
title: "database.ts, configFor and storage.ts read through the compiled-file map"
status: draft
updated: 2026-11-09
rfc: "0224-aot-boot-files"
cluster: null
packages: ["trailties", "activestorage", "trails-tsc"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0224 left an open question: whether `configFor` and `config/database.ts`
should go through `rbFLoad`. In Rails both are YAML reads, not loads. The
answer is `loadIseqEval`: it consults the compiled-file map and returns the
module's exports without seating them on `TopLevel`. activestorage's
`active_storage.services` reads `config/storage.ts` the same way.

## Found by

The perry native ladder, wall 35: a compiled rung 08 fails with
`Failed to load database config from "config/database.ts": Cannot find module`.

## Change

- `loadDatabaseConfigModule`, `Application#configFor` and
  `active_storage.services` read their file through `loadIseqEval`.
- `trails build` lists every top-level `config/*.{ts,js}` file (any of which
  `configFor` can name) and `config/storage/*`, skipping `.d.ts`.

## Acceptance

- `boot-sites-compiled-files.trails.test.ts`: database and `configFor` each read
  through a registered thunk.
- `build-autoload.trails.test.ts`: the boot file registers `database`, `cable`,
  `storage` and `storage/<env>`, and skips declaration files.
