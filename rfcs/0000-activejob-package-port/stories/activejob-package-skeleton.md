---
title: "Create packages/activejob as a published workspace package and wire it into CI"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: []
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 1 of the RFC. There is no `packages/activejob`. Model it on
`packages/globalid/`: published (no `"private": true`), `"version": "0.1.0"`,
`"type": "module"`, `main` / `types` under `dist/`, `"files": ["dist"]`,
`"scripts": { "build": "tsc" }`.

**Dependencies** mirror the gemspec (`vendor/rails/v8.0.2/activejob/activejob.gemspec:35-36`:
`activesupport`, `globalid`): `@blazetrails/activesupport`,
`@blazetrails/globalid`, `@blazetrails/ruby-compat`, `@blazetrails/i18n`, and
`@blazetrails/date` for `Date` / `DateTime` / `Time`. **No
`@blazetrails/activerecord` edge** (RFC "Package shape").

**Src is three real ports, not stubs:** `src/gem-version.ts` + `src/version.ts`
(`vendor/rails/v8.0.2/activejob/lib/active_job/gem_version.rb`, 17 lines; `version.rb`, 10), `src/deprecator.ts`
(`deprecator.rb`, 7 lines: `ActiveSupport::Deprecation.new` as
`ActiveJob.deprecator`), and `src/index.ts` exporting them.

Registrations. Each one that is missing turns a different CI lane red, one
round at a time, and `pnpm typecheck` stays green locally through all of them
because husky leaves a built `dist/`:

- root `tsconfig.json` reference;
- `vitest.config.ts`: both alias entries, trailing-slash subpath entry above
  the bare one;
- `packages/activerecord/dx-tests/tsconfig.json` and
  `packages/activerecord/virtualized-dx-tests/tsconfig.json` `paths`
  (activerecord imports `@blazetrails/activejob` once RFC 0116 lands);
- `packages/activesupport/src/cache/file-store-lock-worker-hooks.trails.mjs`:
  confirm it resolves the new package generically;
- `.github/workflows/ci.yml`: an activejob path in `AR_PKGS_RE` (`:111`) and
  `TRAILTIES_PKGS_RE` (`:115`), and `packages/activejob` in the non-AR
  `pnpm vitest run` step (`:778-795`) and the coverage list (`:925-940`).
  Update `scripts/ci-suite-coverage.test.ts`'s fixture literals if the edited
  `run:` line is one they `.replace()`.

The invocation that runs `packages/activejob` sets `AJ_ADAPTER=inline`, the
first of the RFC's three adapter lanes and Rails' default
(`vendor/rails/v8.0.2/activejob/test/helper.rb:9`). Its setup file lands with
`port-activejob-queue-adapter-and-inline-adapter`.

## Acceptance criteria

- [ ] `packages/activejob/package.json` exists as described, with no `"private": true` and no `@blazetrails/activerecord` dependency.
- [ ] `gem-version.ts`, `version.ts` and `deprecator.ts` port their Ruby files, each with a test.
- [ ] Root `tsconfig.json`, both `vitest.config.ts` aliases and both dx-tests `paths` entries are present.
- [ ] `scripts/ci-suite-coverage.test.ts`, `pnpm test:types` and `pnpm test:types:virtualized` are green (not only `pnpm typecheck`).
- [ ] A plain-node import of the built `packages/activejob/dist/index.js` as the entry module succeeds.

## Definition of done

A `@blazetrails/activerecord` dependency, or an empty `src/index.ts`, does not close this story.
