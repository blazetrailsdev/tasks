---
title: "ar runner / ar console cannot import a generated project's .ts models (no TS loader)"
status: ready
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["activerecord-cli"]
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

Found while verifying the per-package READMEs (2026-09-27, main `b4f622ae87`,
Node 24.16.0). Filed under 0142 because no activerecord-cli bucket is active.

In a fresh `ar new shop --driver better-sqlite3` project, with
`TRAILS_ENV=development`, after `ar generate:model Product name:string price:integer`,
`ar db:migrate` and `ar generate:manifest`:

```text
$ npx ar runner try-runner.ts
ar: runner failed — Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../shop/app/models/product.js' imported from .../shop/app/models/index.ts
```

- `tryLoadModels` (`packages/activerecord-cli/src/db-helpers.ts:23-28`) does a
  plain `import()` of `app/models/index.ts`, and `arRunner`
  (`packages/activerecord-cli/src/runner.ts:52-58`) does the same for the
  script. Node 24's type stripping runs the `.ts` file but does not rewrite
  its `./product.js` specifier, which is what `ar generate:manifest` emits.
  So any project with a model fails. `ar console` loads models the same way.
- The generated `package.json` (`packages/activerecord-cli/src/init.ts`) has no
  `tsx` or other loader, and no build step that would produce the `.js` files.
- Run through `tsx node_modules/@blazetrails/activerecord-cli/bin/ar.js runner try-runner.ts`,
  the same script prints the created row and its SQL. So only the loader is
  missing.

`@blazetrails/trailties` solves the same problem by running every command
through `tsx` (its generated binstubs and `package.json` scripts).

## Acceptance criteria

- In a fresh `ar new` project with a model, `ar runner <script.ts>` and
  `ar console` load the models and the script with no manual loader setup.
  For example, the generated project adds `tsx` and routes the `ar` scripts
  through it, as `trails new` does, or `ar` registers a loader itself.
- The e2e happy-path suite runs `ar runner` against a project with at least
  one generated model.
