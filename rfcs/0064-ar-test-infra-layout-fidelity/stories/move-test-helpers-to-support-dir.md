---
title: "Rename test-helpers/ to support/ to match Rails test/support/"
status: ready
updated: 2026-07-26
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 30
pr: null
claim: null
assignee: null
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

Spike: `docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md` (PR #5309).
This is step 1 of that plan and must land before the sibling stories, so they
edit files at their final paths.

## Acceptance criteria

- `git mv packages/activerecord/src/test-helpers` →
  `packages/activerecord/src/support`, keeping `models/`, `fixtures/`, and
  `test-schema.ts` inside it (they already mirror `test/models/`,
  `test/fixtures/`, `test/schema/schema.rb`).
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
