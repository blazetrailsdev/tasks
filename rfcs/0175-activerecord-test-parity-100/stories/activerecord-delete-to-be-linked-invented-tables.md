---
title: "activerecord-delete-to-be-linked-invented-tables"
status: draft
updated: 2026-10-01
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

`to_be_linked_accounts` and `to_be_linked_users` are invented tables: `vendor/rails/v8.0.2/activerecord/test/schema/schema.rb` declares neither, no trails test reads them, and no Rails test loads `vendor/rails/v8.0.2/activerecord/test/fixtures/to_be_linked/{accounts,users}.yml` (a grep of `test/cases`, `test/models` and `test/schema` for `to_be_linked` is empty). They survived trails#8330, which deleted the other 60 dead inventions, because `pnpm exec tsx scripts/fixtures-compare/compare.ts --package activerecord --ci` (the `fixtures` bg-gate in the `Rails API/Test Comparison` job, `.github/workflows/ci.yml:1716`) depends on them.

The dependency is in `scripts/fixtures-compare/compare.ts:905-917`: a namespaced fixture is aliased to its basename unless `TEST_SCHEMA[joined]` exists. With `to_be_linked_users` / `to_be_linked_accounts` gone from `TEST_SCHEMA`, `to_be_linked/users` and `to_be_linked/accounts` are schema-checked (`schemaCheck`, `compare.ts:628-659`) against the unrelated canonical `users` and `accounts` tables, every attribute is flagged `schema-extra-col`, and the gate reds: `match regressed: 136 < baseline 137`, `diff grew: 7 > baseline 6`.

Rails derives a fixture set's table name by replacing `/` with `_` (`ActiveRecord::FixtureSet`'s default table name), so `to_be_linked/users` is `to_be_linked_users` there, never `users`. The basename alias is right only for a grouping dir a test points `fixture_paths` at (`reserved_words/`).

Note `pnpm parity:fixtures` without `--ci` exits 0 either way, so it does not detect this.

## Acceptance criteria

- [ ] `scripts/fixtures-compare/compare.ts` reports `to_be_linked/accounts` and `to_be_linked/users` as `schema:not-ported` when no `to_be_linked_*` table exists, rather than checking them against `users` / `accounts`. Covered by a test in `scripts/fixtures-compare/`.
- [ ] `to_be_linked_accounts` and `to_be_linked_users` are deleted from `packages/activerecord/src/support/canonical-schema.ts`, `packages/activerecord/src/test-helpers/test-schema.ts` and `scripts/schema-compare/invented-baseline.json` (by hand, only-shrink).
- [ ] `pnpm parity:schema` baselined 14 → 12, and the `--ci` fixtures gate stays at `match>=137 diff<=6` without lowering `CI_BASELINE`.
