---
title: "layout-src-references-finds-unprefixed-mjs-and-generic-resolvers"
status: ready
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# src-references finds unprefixed paths, .mjs files and generic src resolvers

## Context

On trails#9794 (ruby-compat pilot), `pnpm layout:src-references ruby-compat`
printed nothing, but CI still went red on `src/` references it never reports:

- Paths with no `packages/` prefix: `../../ruby-compat/src/...` in the
  `paths` of `packages/{actionview,activerecord,rack}/dx-tests/tsconfig.json`
  and `packages/{activerecord,trailties}/virtualized-dx-tests/tsconfig.json`,
  plus `packages/website/aliases.ts` and docs citations.
- `.mjs` files: `packages/activesupport/src/cache/file-store-lock-worker-hooks.trails.mjs`
  built `${name}/src/index.ts` for every `@blazetrails/*` specifier.
- Resolvers that build `<pkg>/src/` generically, mapping `dist/` back to
  `src/`: `packages/trailties/src/production-boot.trails.test.ts:31`,
  `packages/ruby-compat/test-setup/class-paths.ts` (its `/packages/<pkg>/src/`
  testPath regex silently skipped tests under `test/`),
  `packages/actionpack/src/published-entry-points.trails.test.ts:20`,
  `scripts/parity/import-cycles.ts` (fixed in #9794).

Each was found by a red CI job, one at a time.

## Acceptance criteria

- [ ] `scripts/layout/src-references.ts <pkg>` also reports
      `<pkg>/src/` with any relative prefix (`../`, `../../`), and scans
      `.mjs` / `.cjs` / `.mts` and `tsconfig*.json` files.
- [ ] It reports the generic shapes `/${...}/src/`, `"src/"` replacements of
      `dist/`, and `/packages\/([^/]+)\/src\//` regexes, with file:line, as a
      separate "generic resolver" section, even when no package name appears.
- [ ] Run against main with ruby-compat migrated: it lists the remaining
      generic resolvers above (`published-entry-points`) and nothing ruby-compat
      specific.
- [ ] A unit test covers one fixture for each of the three shapes.
