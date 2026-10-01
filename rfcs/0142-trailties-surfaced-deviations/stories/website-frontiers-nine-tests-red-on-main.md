---
title: "Nine website frontiers tests are red on main (generator construction, app-server, sql-js driver) and no CI job runs them"
status: draft
updated: 2026-10-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while verifying trails#8318. Nine tests under `packages/website/src/lib/frontiers` fail on
`main` (reproduced with `main`'s own `vfs-generator.ts`, after `pnpm build` and
`svelte-kit sync`), and the `Website` CI job is skipped on PRs, so nothing reports them. vitest
counts 9 failed tests in 4 files; the per-file figures below count its `FAIL` entries, which
include failed `describe` blocks:

- `tutorials/generator-fixtures.test.ts` (6): `TypeError: Cannot read properties of undefined
(reading 'includes')` at `NamedBase#assignNamesBang`
  (`packages/trailties/src/generators/named-base.ts:150`), reached from `new NamedBase`
  (`named-base.ts:37`) via `ActiveRecord::Generators::ModelGenerator`
  (`generators/active-record/model/model-generator.ts:14`). The test's `makeModelGen`
  (`generator-fixtures.test.ts:12`) constructs the generator in a shape that no longer supplies
  `name`.
- `runtime.test.ts` (5): `generate model` / `generate migration` write no files (the same
  constructor failure, swallowed by the CLI), and the two `db:migrate:status` cases then see
  "No migrations found in db/migrate/".
- `app-server.test.ts` (3): a registered controller answers 500, and unmatched routes answer
  `Not Found` / 500 where the test expects "No route matches" / 404.
- `sql-js-driver.test.ts` (1): `TypeError: Class extends value undefined is not a constructor or
null` in the relation delegate cache (`class extends klass` over `delegatedClasses()`), a
  load-order hole when the website enters activerecord through its own entry module.

Related, done: `website-frontiers-runtime-dbmigrate-and-sandbox-sw-tests-red`,
`website-src-tests-run-in-no-ci-job`.

## Acceptance criteria

- [ ] Each of the four files is root-caused and passes: `pnpm vitest run src/lib/frontiers` in
      `packages/website` is green.
- [ ] The website's `VfsModelGenerator` / `VfsMigrationGenerator` / `VfsAppGenerator`
      (`vfs-generator.ts`) construct trailties' generators with the arguments their constructors
      take today.
- [ ] The frontiers tests run in a CI job that is not skipped when `packages/trailties`,
      `packages/activerecord` or `packages/ruby-compat` change, so the next break is reported.
- [ ] Test names unchanged.
