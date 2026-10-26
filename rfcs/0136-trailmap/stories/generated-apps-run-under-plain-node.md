---
title: "Generated apps run their TypeScript under plain node, not the tsx loader"
status: claimed
updated: 2026-10-26
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-10-26T20:49:16Z"
assignee: "generated-apps-run-under-plain-node"
blocked-by: null
closed-reason: null
---

## Context

A generated app's sources are TypeScript that plain Node cannot run, so every
command that executes app code goes through the `tsx` loader, and a deployed app
ships and runs that compiler in production.

- `packages/trailties/src/generators/app-generator.ts:36-38` sets
  `TRAILS_LOADER = "tsx"`. Every generated `package.json` script
  (`:223-229`) and the `bin/trails` binstub (`:494`) spawn it.
- The generated `tsconfig.json` uses `module`/`moduleResolution: "Node16"`
  (`:297`), which spells relative imports `./x.js` with no file behind them. The
  generated README says so (`:371-376`). The generator's templates write about
  334 such specifiers across 42 files.

Node 24 (trails' `engines.node`) runs `.ts` natively by stripping types. That
is no compiler, but it only works when a specifier names the `.ts` file and
the source uses erasable syntax only. TypeScript supports exactly that
convention: `rewriteRelativeImportExtensions` (5.7) keeps `tsc`'s emitted `.js`
correct, and `erasableSyntaxOnly` (5.8) refuses syntax Node cannot strip.

Rails runs its application source directly. A trails app that ran its source
under plain `node` would match that, and would let tools that load app files
(`trails-tsc-views build` loading `config/initializers`, as Rails'
`load_config_initializers` does) work without a loader. Surfaced by trailmap,
whose view build fails importing `config/initializers/hub-database.ts`:
`Cannot find module '…/config/database.js'`.

## Acceptance criteria

- [ ] The generated `tsconfig.json` sets `rewriteRelativeImportExtensions` and
      `erasableSyntaxOnly`, and generated apps depend on `typescript` ^5.8.
- [ ] Every generator template writes relative specifiers with `.ts`.
- [ ] Generated scripts and `bin/trails` run `node`, not `tsx`, and `tsx` is no
      longer a generated dependency. The README's loader paragraph goes.
- [ ] A test generates an app, then boots it and runs `trails-tsc-views build`
      under plain `node` with no loader.
