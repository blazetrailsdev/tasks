---
title: "Generate TypeDoc for every published package from the package list"
status: draft
updated: 2026-11-18
rfc: "0000-website-refresh"
cluster: website-docs
packages: [website]
deps: [website-pages-deploy-workflow, website-typedoc-backslash-angle-double-escaped]
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3. `packages/website/typedoc.config.mjs:12-19` hard-codes six
entry points (arel, activemodel, activerecord, activesupport, rack,
actionpack), and `packageOptions.entryPoints: ["lib/index.ts"]` (`:33`)
cannot reach the 14 packages with no `lib/index.ts`: builder, chronic,
et-orbi, fugit, image-processing, marcel, mini-magick, mini-mime, net-smtp,
raabro, rake, thor, turbo and zeitwerk. Their entry is the `"."` export.
54 of the 55 workspace packages are published (only `@blazetrails/website` is
`private`). TypeDoc declares only `@missingRailsCall` / `@noRailsEquivalent`
(`:7`), and logged 162 `unknown block tag` warnings on 2026-11-18
(`@inventedArm`, `@inlinedFrom`, `@perf`, …). The `/api/` sidebar is also
hand-kept (`docs/.vitepress/config.ts:40-52`). The website half of
`make-new-package-registration-self-maintaining` is the reason not to add a
guard instead.

## Acceptance criteria

- [ ] `entryPoints` is computed from `packages/*/package.json`, keeping every non-`private` package. Each package's entry is the source file behind its `exports["."]`.
- [ ] The tag list is read from the receipt-tag names the repo's eslint rules already enumerate, or from one shared constant they and TypeDoc both import, so `typedoc` logs 0 `unknown block tag` warnings.
- [ ] The VitePress `/api/` sidebar is generated from the same list, grouped as in the RFC's landing grid (Models, Controllers & views, Other components, Rails 8 defaults, Gems, Tooling).
- [ ] `api/**` stays excluded from local search.
- [ ] `docs:build` exits 0, and the sidebar lists 54 packages.
- [ ] A test in `packages/website/scripts/` fails if a published package is missing from the computed list.
