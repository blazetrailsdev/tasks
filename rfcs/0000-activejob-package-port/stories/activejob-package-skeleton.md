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

**Dependencies** mirror the gemspec
(`vendor/rails/v8.0.2/activejob/activejob.gemspec:35-36`: `activesupport`,
`globalid`): `@blazetrails/activesupport`, `@blazetrails/globalid`,
`@blazetrails/ruby-compat`, `@blazetrails/i18n`. **No
`@blazetrails/activerecord` edge.** The RFC's "Package shape" reads
`ActiveRecord` through `TopLevel` at call time.

**Src is three real ports, not stubs:**

- `src/gem-version.ts` + `src/version.ts`: `vendor/rails/v8.0.2/activejob/lib/active_job/gem_version.rb`
  (17 lines) and `version.rb` (10). `packages/activesupport`'s gem-version
  port is the model.
- `src/deprecator.ts`: `deprecator.rb` (7 lines),
  `ActiveSupport::Deprecation.new` as `ActiveJob.deprecator`.
- `src/index.ts` exporting them.

Registrations. Each missing one reds a different lane
(`project_new_package_subpath_needs_four_registrations`,
`project_new_package_needs_ci_yml_and_guard_fixture`):

- root `tsconfig.json` reference;
- `vitest.config.ts`: both alias entries, with the trailing-slash subpath
  entry above the bare one;
- `packages/activerecord/dx-tests/tsconfig.json` and
  `packages/activerecord/virtualized-dx-tests/tsconfig.json` `paths`. activerecord
  will import `@blazetrails/activejob` once RFC 0116 lands, so map it now;
- `packages/activesupport/src/cache/file-store-lock-worker-hooks.trails.mjs`:
  check that it handles the new package generically (it splits the specifier
  since #7365);
- `.github/workflows/ci.yml`: an activejob path in `AR_PKGS_RE` (`:111`) and
  `TRAILTIES_PKGS_RE` (`:115`), both of which will consume it, and
  `packages/activejob` added to the non-AR `pnpm vitest run` step (`:778-795`)
  and the coverage list (`:925-940`). Update
  `scripts/ci-suite-coverage.test.ts`'s fixture literals if the edited `run:`
  line is one they `.replace()`.

The invocation that runs `packages/activejob` sets `AJ_ADAPTER=inline`. This
is the first of the RFC's three adapter lanes ("Adapter lanes"), and Rails'
default is `ENV["AJ_ADAPTER"] ||= "inline"`
(`vendor/rails/v8.0.2/activejob/test/helper.rb:9`). The setup file that ports
`test/helper.rb` and `test/adapters/inline.rb` needs `queue_adapter=`, so it
lands with `port-activejob-enqueuing-execution-and-inline-adapter`.
`port-activejob-test-and-async-adapters` adds the `test` and `async` lanes.

## Acceptance criteria

- [ ] `packages/activejob/package.json` exists as described, with no
      `"private": true`, and does not depend on `@blazetrails/activerecord`.
- [ ] `src/gem-version.ts`, `src/version.ts` and `src/deprecator.ts` port their
      Ruby files, and each has a test.
- [ ] Root `tsconfig.json`, both `vitest.config.ts` aliases and both dx-tests
      `paths` entries are present.
- [ ] `scripts/ci-suite-coverage.test.ts` is green with the new package, and
      `pnpm test:types` and `pnpm test:types:virtualized` pass, not only
      `pnpm typecheck`.
- [ ] A plain-node import of the built `packages/activejob/dist/index.js`,
      used as the entry module, succeeds.
