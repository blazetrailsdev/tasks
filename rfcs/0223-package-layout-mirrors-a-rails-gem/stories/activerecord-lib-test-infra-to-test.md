---
title: "activerecord-lib-test-infra-to-test"
status: in-progress
updated: 2026-11-12
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10036
claim: "2026-11-12T19:06:52Z"
assignee: "activerecord-lib-test-infra-to-test"
blocked-by: null
closed-reason: null
---

## Context

trails#10034 moved activerecord to `lib/` + `test/` with `plan-test-moves`. The tool keeps a test-support file in `lib/` when a library file imports it (a layering finding), so these test-only files still live under `packages/activerecord/lib/` and are held out of the build by `tsconfig.json` `exclude`:

- `lib/test-setup-{worker-db,dy,mysql,pg-cancel-trace,ddl-profile}.ts`
- `lib/cases/{helper,test-case,json-shared-test-cases,validations-repair-helper}.ts` (Rails `test/cases/helper.rb`, `test/cases/test_case.rb`)
- `lib/config.ts` (Rails `test/config.rb`)
- `lib/support/*` test helpers (`connection.ts`, `load-schema-helper.ts`, `setup-second-pool.ts`, `drop-all-tables.ts`, `ar-db-slots.ts`, `canonical-table-rebuild.ts`, `sqlite-template.ts`, ...)
- `lib/test-helpers/{use-fixtures,models/post}.ts`, `lib/test-adapter.ts`, `lib/adapters/*/test-helper.ts`, `lib/encryption/test-helpers.ts`

The importers are generated tables (`lib/constants*.generated.ts`, `lib/namespaces.ts`) and `lib/relation/delegation.bench.ts`.

Also: `plan-test-moves` follows a symlinked directory (`fixtures/all/admin`) and fails on `git mv`; it rewrites specifiers only in moved files, and leaves unreferenced assets in place.

## Acceptance criteria

- Each file above lives at its Rails `test/` home (`test/cases/helper.ts`, `test/config.ts`, `test/support/...`); no `lib/` module imports a `test/` module.
- `packages/activerecord/tsconfig.json` has no per-file `exclude` for test code.
- `plan-test-moves` moves a directory symlink as one entry and rewrites specifiers in files that stay.
