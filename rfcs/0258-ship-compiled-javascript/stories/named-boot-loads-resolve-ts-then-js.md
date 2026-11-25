---
title: "Files the boot loads by name resolve .ts then .js in a compiled tree"
status: in-progress
updated: 2026-11-25
rfc: "0258-ship-compiled-javascript"
cluster: null
packages: ["trailties", "actionpack", "activerecord"]
deps: ["root-marker-and-rackup-resolve-compiled-config"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#10763
claim: "2026-11-25T15:44:50Z"
assignee: "named-boot-loads-resolve-ts-then-js"
blocked-by: null
closed-reason: null
---

## Context

With the root found, the boot still names application files with `.ts`.
On trails `main`:

- `trailties` `application/configuration`: `config/database.ts`, `config/environment.ts`
- `trailties` `engine`, `engine/configuration`: `config/routes.ts`, `db/seeds.ts`
- `trailties` `server/main`: `application.ts`
- `trailties` `trailties/active-record`: `${path}/schema.ts`
- `actionpack` `Mapper#draw`: `${path}/${name}.ts`

RFC 0224 sends most of these loads through `rbFLoad` / `rbFRequireFile`, and
a `registerCompiledFiles` map answers them in a `trails build` bundle. A tsc
`dist/` tree has no map, so each lookup has to find the `.js` file itself.

## Acceptance

- Each site resolves through the helper from
  `root-marker-and-rackup-resolve-compiled-config`.
- A `registerCompiledFiles` entry keyed by the `.ts` path still wins, so the
  perry and bundler paths are unchanged.
- `schema.ts` loading in `db:prepare` / `db:schema:load` finds `schema.js`.
  The schema dumper keeps writing `.ts` in development.
- Audit the boot once more for any `.ts` literal this list missed, for
  example by grepping `dist/` of trailties, actionpack and activerecord for
  string literals ending in `.ts` outside generators. Fix each one or list it
  in the PR with its reason.
- Each site has a test against a `.js`-only fixture.
