---
title: "Create packages/ruby-compat: an empty leaf package wired into the workspace, with its contract documented"
status: ready
updated: 2026-08-30
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["vendor-ruby-mri-source"]
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 1 of the migration. The package exists before any primitive moves into it,
so every later move story is a pure move against a working target rather than a
move plus a scaffold.

Model the scaffold on `packages/date/` — the most recent package added for a
non-Rails upstream — for `package.json`, `tsconfig.json`, build wiring and the
workspace registration in `pnpm-workspace.yaml`. Cross-package registrations are
easy to half-do: the vitest alias, both `vitest.dx-tests.config.ts` tsconfigs,
and the root `tsconfig.json` project reference all need the new name, and
`pnpm typecheck` passes without them.

`ruby-compat` is a **leaf**: it depends on nothing, and everything else may
depend on it. Do not add a dependency on `@blazetrails/activesupport` — that is
the inversion the package exists to remove.

The package README is load-bearing here, not decoration: it is where the
standing rule lives, and later contributors will read it instead of the RFC.

## Acceptance criteria

- `packages/ruby-compat/` with `package.json` (`@blazetrails/ruby-compat`, no
  workspace dependencies), `tsconfig.json`, build config and `src/index.ts`
  exporting nothing yet.
- Registered in `pnpm-workspace.yaml`, the root `tsconfig.json` references,
  `vitest.config.ts` aliases (including the trailing-slash subpath entry —
  a bare prefix alias swallows subpaths), and both `vitest.dx-tests.config.ts`
  tsconfigs.
- `packages/ruby-compat/README.md` states the package contract in full:
  (a) **only what trails actually calls** — no member without a real call site
  in this repo, enforced by `parity:api:extra`, not by review;
  (b) every export carries a `vendor/ruby/<file>:<line>` citation AND a
  `@noRailsEquivalent PERMANENT` receipt, and why both are required;
  (c) `parity:api` never enrolls this package, permanently;
  (d) it is a leaf and takes no workspace dependencies.
- No empty stubs or placeholder interfaces (CLAUDE.md) — `index.ts` exporting
  nothing is the whole surface until the first move story.
- `pnpm typecheck`, `pnpm lint` and a `pnpm vitest run packages/ruby-compat`
  invocation all succeed; `pnpm parity:api` delta non-negative.
