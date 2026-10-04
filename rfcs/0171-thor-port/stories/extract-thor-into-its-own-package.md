---
title: "Extract Thor into its own @blazetrails/thor package"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0171 decision 3 ("Package home: `@blazetrails/thor`") moves Thor out of the trailties
pseudo-package into its own workspace package. The reason is a second consumer,
`@blazetrails/activerecord-cli`, which cannot import trailties: trailties depends on it
(`packages/trailties/package.json`, and `packages/trailties/src/generators/app-generator.ts:247` adds it to new apps).

Today:

- Thor is 48 files (about 8,000 lines) under `packages/trailties/src/thor/`. Outside its tests
  it imports only `@blazetrails/ruby-compat`, `@blazetrails/did-you-mean` and its own files.
- Two trailties files import it: `packages/trailties/src/generators/base.ts` and
  `packages/trailties/src/generators/generated-attribute.ts`.
- Some Thor tests reach outside Thor. `packages/trailties/src/thor/actions.test.ts:4` imports
  `GeneratorBase` from `../generators/base.js`, and about 10 test imports pull in
  `@blazetrails/activesupport`. The thor gem depends on neither.
- Tooling treats `thor` as a package nested in trailties:
  `scripts/api-compare/config.ts:47` (`PACKAGE_DIR_OVERRIDES.thor = "trailties"`) and `:111`
  (`PACKAGE_SRC_SUBDIR.thor`); `scripts/test-compare/extract-ts-tests.ts:21`
  (`NESTED_PACKAGES`); `scripts/test-compare/compare.ts:155,1584`;
  `scripts/test-compare/generate-stubs.ts:39`; the eslint `files` glob at
  `eslint.config.mjs:777` (thor-import-boundary, thor-command-registration);
  `scripts/ci/thor-only.sh` and `scripts/ci/thor-comparison.sh`; and the `thor_only` filter in
  `.github/workflows/ci.yml:74,302`.

## Acceptance criteria

- [ ] `packages/thor` is a workspace package published as `@blazetrails/thor`. Its runtime
      dependencies are exactly `@blazetrails/ruby-compat` and `@blazetrails/did-you-mean`.
      Thor's source and tests move with `git mv`, so history follows them.
- [ ] trailties depends on `@blazetrails/thor` and imports it by package name.
      `packages/trailties/src/thor/` no longer exists.
- [ ] A Thor test that needs trailties (`actions.test.ts`'s `GeneratorBase`) either moves to
      trailties or is rewritten against a plain `Thor::Group` the way Thor's own spec does
      (`vendor/thor/v1.3.2/spec/actions_spec.rb`). Test names are not changed. Test-only
      activesupport imports go, or activesupport becomes a devDependency only.
- [ ] The new-package registrations are in place: `pnpm-workspace.yaml` is covered by
      `packages/*`; the root `tsconfig.json` references; the `vitest.config.ts` aliases; the
      `paths` in `packages/activerecord/dx-tests/tsconfig.json` and
      `virtualized-dx-tests/tsconfig.json` if anything there reaches Thor; and `ci.yml` with
      its lane, package regex and the `scripts/ci-suite-coverage.test.ts` fixture literals.
- [ ] api-compare, test-compare and the CI thor scripts treat `thor` as a top-level package:
      the nested-package overrides above are deleted, not repointed. `parity:api --package thor`
      and `parity:test` report the same matched counts as on main.
- [ ] The two thor eslint rules apply to `packages/thor/src/**`, mirrored into
      `eslint/rails-private-jsdoc.config.mjs` where that file mirrors root globs.
      thor-import-boundary still allows only ruby-compat and did-you-mean.
- [ ] Body pins and call-gate baselines that key on `trailties/src/thor` paths are moved, not
      reseeded: `pnpm parity:api:pins`, `pnpm parity:api:calls` and `pnpm parity:api:calls:args`
      are green with no new rows.
- [ ] Open 0171 stories that cite `packages/trailties/src/thor/...` paths are not rewritten.
      Their paths map one-for-one onto `packages/thor/src/...`, and the PR body says so.
- [ ] `ar` is not changed. Moving it onto Thor is a separate decision.
