---
title: "A trails app bundles into one esbuild file and runs on AWS Lambda"
status: in-progress
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trails-tsc", "actionview", "actionpack", "rack-session", "activerecord", "website"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10314
claim: "2026-11-18T20:50:53Z"
assignee: "single-file-esbuild-bundle-runs-on-aws-lambda"
blocked-by: null
closed-reason: null
---

## Context

The serverless spike (report: `/home/dean/.btwhooks/data/github/blazetrailsdev/trails/audits/serverless-20261118T171557Z.md`)
found a minimal trails app could not run from a single esbuild bundle:

- B1: three static class-expression fields are named like an aliased import's original name
  (`actionpack/lib/action-dispatch/routing/mapper.ts` `BacktraceCleaner`,
  `rack-session/lib/cookie.ts` `SessionId`, `activerecord/lib/migration/compatibility.ts`
  `ReferenceDefinition`). esbuild renames the import onto the inner name, and the bundle throws a TDZ error at load.
- B3: `boot.generated.js` (`trails-tsc/lib/build-autoload.ts` `writeBoot`) roots its compiled-file map at
  `new URL("..", import.meta.url)`, which misses once the file is inlined into a bundle at the app root.
- B5 (part): the generated install module sets `loader.imports` but not `loader.manifest`, so a
  production boot walks `app/`.
- B4: precompiled views are loaded by a computed `import(url)` in actionview's `templateCompiler`
  (`actionview/lib/template.ts`), outside the boot map.
- B8: the website rack-bridge (`website/src/lib/frontiers/rack-bridge.ts`) crashes on `SafeBuffer` chunks and
  comma-joins an array-valued header such as `set-cookie`.

## Acceptance criteria

- The three class expressions drop their inner name, keeping the Rails constant names.
- `writeBoot` roots the map with `Application.findRoot(import.meta.dirname)`, and lists each engine's
  `.trails/views/**/*.js`.
- `writeEntry` hands each loader its `manifest.json` beside its imports.
- `templateCompiler` loads a registered compiled view through `loadIseqEval`.
- rack-bridge stringifies non-`Uint8Array` chunks and non-string header values, appends each value of an
  array header, and awaits an async body `close`.
- Each fix has a test, verified to fail on main.
- `examples/serverless-lambda` bundles the app with esbuild and runs it on AWS Lambda (`nodejs26.x`), on
  SQLite or on RDS PostgreSQL. It runs locally under the Lambda emulator image.
- The example ships the generated app's `config.ts`, so `Application.findRoot` roots it from any directory.
- `examples/serverless-lambda/infra/` is Terraform for the function, its Function URL, an optional
  execution role and an optional RDS PostgreSQL arm, seeded on apply.
