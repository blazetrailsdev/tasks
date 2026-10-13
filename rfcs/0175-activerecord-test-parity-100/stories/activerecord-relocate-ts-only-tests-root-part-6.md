---
title: "activerecord-relocate-ts-only-tests-root-part-6"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
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

Split from `activerecord-relocate-ts-only-tests-root-part-5`, whose PR cleared seven of that
story's nine files and stopped at the LOC ceiling: a moved test counts once as a deletion and
once as an addition, and each new `.trails.test.ts` sibling repeats its file's setup.

`pnpm parity:test` still counts these TS-only extras in two Rails-named root test files.
Neither has a `.trails.test.ts` sibling yet.

`packages/activerecord/src/test-databases.test.ts` (3, none in
`vendor/rails/v8.0.2/activerecord/test/cases/test_databases_test.rb`):

- `suffixes a URL-based config by deriving the database from configuration.url`
- `reconnects through the ensure even when the registry is empty`
- `restores VERBOSE and re-establishes connection after schema load failure`

The last one reads and writes `process.env.VERBOSE` and builds its config as
`const mockConfig: any`. In the sibling use `getEnv` (`@blazetrails/activesupport`) and
`setEnv` (`@blazetrails/ruby-compat`), which `test-databases.ts` itself uses, and a
`UrlConfig` as the first test does. The sibling needs the file's `stubConfigurations`
helper, the `AR_NO_AUTO_SCHEMA` stub, and the `Base.configurations` save/restore hooks.

`packages/activerecord/src/cache-key.test.ts` (2, none in
`vendor/rails/v8.0.2/activerecord/test/cases/cache_key_test.rb:28-123`):

- `cache_version does call updated_at when default_timezone is not utc` (sqlite only)
- `cache_version does call updated_at when a DB-format string is assigned by the user`

Both use the file's `cacheMeWithVersion()` factory, which returns `as any`, and the
`cache_me_with_versions` table the file's `beforeEach` creates with
`(t: any) => t.timestamps()`. In the sibling declare the class once with
`declare updated_at: unknown` and give `createTable` a block body, since the block's type is
`(t: TableDefinition) => void | Promise<void>`. After the move `setDefaultTimezone` is
unused in `cache-key.test.ts`.

## Acceptance criteria

- [ ] The five tests above move to `test-databases.trails.test.ts` and
      `cache-key.trails.test.ts`, with no `as any` and no `process.*` in the new files.
- [ ] Both Rails-named files report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
