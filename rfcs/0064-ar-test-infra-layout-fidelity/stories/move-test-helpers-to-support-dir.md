---
title: "Rename test-helpers/ to support/ to match Rails test/support/"
status: done
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 30
pr: 5361
claim: "2026-07-26T16:46:56Z"
assignee: "move-test-helpers-to-support-dir"
blocked-by: null
closed-reason: null
---

## Context

Rails' AR test infra lives in `vendor/rails/activerecord/test/support/` — ten
files: `config.rb`, `connection.rb`, `connection_helper.rb`,
`load_schema_helper.rb`, `adapter_helper.rb`, `async_helper.rb`, `ddl_helper.rb`,
`schema_dumping_helper.rb`, `fake_adapter.rb`, `tools.rb`. trails calls the same
tree `packages/activerecord/src/test-helpers/` — an invented name.

Two files in it are already exact kebab renderings of their Rails counterparts:
`test-helpers/connection-helper.ts` (← `support/connection_helper.rb`) and
`test-helpers/schema-dumping-helper.ts` (← `support/schema_dumping_helper.rb`).
The file-level mirroring has already started; only the directory name is wrong.

See this RFC's README for the target layout and the A-D disposition.
This is step 1 of that plan and must land before the sibling stories, so they
edit files at their final paths.

## Acceptance criteria

- **Re-scan first.** The A-D table in this RFC's README was taken against an older
  commit; `main` drifts (`rocket-tables.ts` landed after it was written). Before
  moving anything, list `test-helpers/` against current `main` and assign any
  file missing from the table to a bucket, noting it in the PR body.
- **This is NOT a whole-directory `git mv`.** `test-helpers/` survives. Create
  `support/` and move only the files listed below; see the "Disposition of every current
  `test-helpers/` entry" section of this RFC's README for the full A-D
  disposition of all 36 files and 4 subdirectories.
- **Stays in `test-helpers/` (bucket A)** — mirrors the Rails `test/` root, not
  `test/support/`: `models/`, `fixtures/`, `migrations/`, `assets/`,
  `test-schema.ts`.
- **Moves to `support/` (bucket B — renamed later by stories 3-5, moved
  under its current name now)**: `connection-helper.ts`,
  `schema-dumping-helper.ts`, `test-connection-env.ts`,
  `test-database-config.ts`, `arunit2-config.ts`, `supports.ts`,
  `canonical-schema.ts`, `schema-file-generator.ts`, `second-connection.ts`,
  `setup-second-pool.ts`, `setup-handler-suite.ts`.
- **Moves to `support/` keeping its invented name (bucket C)**:
  `ar-db-slots.ts`, `ar-db-forks-default.ts`, `sqlite-template.ts`,
  `template-global-setup.ts`, `skip-global-reset.ts`, `ddl-profile.ts`,
  `canonical-model-index.ts`, `canonical-model-index-encryption-setup.ts`,
  `quote-regex.ts`, `with-db-warnings-action.ts`, `setup-adapter-suite.ts`,
  `drop-all-tables.ts`, `seed-association-cache.ts`, `schema-types.ts`.
- **Left in place for story 7 (bucket D)**: the fixtures machinery
  (`fixtures.ts`, `fixture-set.ts`, `define-fixtures.ts`,
  `fixtures-registry.ts`, `use-fixtures.ts`, `with-transactional-fixtures.ts`,
  `use-transactional-tests.ts`), `in-time-zone.ts`, `protected-params.ts`,
  `repair-validations.ts`. Do not move these.
- Update every referencing path: `vitest.config.ts`, the `eslint.config.mjs`
  ignores (`packages/activerecord/src/test-helpers/**` appears at least at
  `:431`, `:460`, `:483`), `eslint/no-explicit-any-src-exclude.json`,
  `eslint/rails-error-parity-exclude.json`, and the `scripts/*-compare/`
  constants that point at `test-helpers/models`, `test-helpers/fixtures`,
  `test-helpers/test-schema.ts` (`scripts/fixtures-compare/compare.ts:23,932`,
  `scripts/schema-compare/compare.ts:16`, `scripts/fixtures-inventory/inventory.ts:18`).
- `pnpm schema:compare` and `pnpm fixtures:compare` must produce identical
  output before and after — they key off these paths and feed Dean's stats DB.
- Import-path churn only: no behavior change, no file contents edited beyond
  import specifiers. This is the single mechanical rename CLAUDE.md exempts from
  the fan-out rule; note that in the PR body.
