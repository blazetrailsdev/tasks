---
title: "A fresh trails new app's trails-tsc build fails: @blazetrails/date and Node typings unresolved"
status: ready
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages: ["trailties", "activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the root README quickstart (2026-09-27, main `b4f622ae87`).
trails#8095 (`generated-app-typechecks-with-tsc-not-trails-tsc`) switched the
generated `build` script to `trails-tsc --schema db/schema.ts`. On a fresh
`trails new blog` + `generate scaffold Post title:string body:text` + `db:migrate`,
`pnpm build` still fails, with two independent errors:

```text
app/models/post.ts(7,28): error TS2307: Cannot find module '@blazetrails/date' or its corresponding type declarations.
config/environments/development.ts(1,28): error TS2591: Cannot find name 'node:fs'. Do you need to install type definitions for node? ...
config/environments/production.ts(36,45): error TS2591: Cannot find name 'process'. ...
```

1. The virtualized model types datetime columns as
   `import("@blazetrails/date").Temporal…`
   (`packages/activerecord/src/type-virtualization/type-registry.ts:3`), but the
   generated `package.json` does not depend on `@blazetrails/date`
   (`packages/trailties/src/generators/app-generator.ts:169-187`). Under pnpm's
   strict layout the app cannot resolve it.
2. The generated `config/environments/*.ts` use `node:fs`, `node:path` and
   `process`, but the generated app has no `@types/node` devDependency, and
   `tsconfig.json` (`app-generator.ts:194-215`) has no `types` entry. The
   `trails-tsc` binary runs on TypeScript 7.1, where `types` defaults to `[]`,
   so installing `@types/node` alone is not enough.

With `@blazetrails/date` added, `@types/node` added and `"types": ["node"]` in
the tsconfig, `pnpm build` passes. It also rejects `const n: number = post.title`
with `Type 'string | null' is not assignable to type 'number'`, so schema-driven
model typing works once the app resolves.

## Acceptance criteria

- A fresh `trails new` app's `pnpm build` passes with no manual edits, on the
  default sqlite database. Either the virtualized types stop naming a package the
  app does not depend on (for example by reaching `Temporal` through
  `@blazetrails/activerecord`), or the generator adds the dependency.
- The generated app declares Node typings in a way the TS 7.1 `trails-tsc` honors.
- A boot-app or generator test runs the generated `build` script, or asserts
  the dependency and tsconfig shape it needs.
