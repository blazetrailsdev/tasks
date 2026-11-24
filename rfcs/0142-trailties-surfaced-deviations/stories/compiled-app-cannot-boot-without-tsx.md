---
title: "A compiled (dist/) application cannot boot under plain node: the framework hardcodes .ts filenames"
status: closed
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "actionpack", "activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by RFC 0258 (tasks#376): 0258-ship-compiled-javascript/root-marker-and-rackup-resolve-compiled-config and named-boot-loads-resolve-ts-then-js"
---

## Context

An application compiled with `trails-tsc` (`tsc` with
`rewriteRelativeImportExtensions`, outDir `dist/`) cannot boot under plain
`node`: the framework names the application's own files with a hardcoded
`.ts` extension, so every production image runs its source through `tsx`
instead of shipping built JavaScript. Rails' analogue has no such split; the
files it loads by name are found whatever produced them.

Booting `dist/` with `node --no-experimental-strip-types`:

1. `Application.findRoot` (trailties `application.ts`) looks only for
   `config.ts` via `findRootWithFlag`, so a `dist/` holding `config.js` exits
   with `configuration config.ts not found`.
2. Given a `config.ts` marker, `commands/server` imports `config.ts` itself as
   the rackup file: `ERR_UNKNOWN_FILE_EXTENSION ".ts"`.

The same assumption, unverified past those two, in:

- trailties `application/configuration`: `config/database.ts`, `config/environment.ts`
- trailties `engine`, `engine/configuration`: `config/routes.ts`, `db/seeds.ts`
- trailties `server/main`: `application.ts`
- trailties `trailties/active-record`: `${path}/schema.ts`
- actionpack `action-dispatch/routing/mapper` (`draw`): `${path}/${name}.ts`
- the migration and schema loaders (`db/migrate/*.ts`), to be checked

Each should resolve a basename against `.ts` then `.js` (Rails'
`config.ru`/`Kernel#require` find-by-name), the way `application.ts`
already tries `[".ts", ".js"]` for one lookup. A test boots a generated app
from its compiled `dist/` under plain node and serves `/up`.

## Found by

trailmap#198 (deploy runs the `.ts` source through `tsx`; the goal is an
image that runs built JavaScript).
