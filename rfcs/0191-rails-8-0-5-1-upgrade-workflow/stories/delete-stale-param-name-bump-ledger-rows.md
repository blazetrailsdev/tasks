---
title: "Delete three stale param-name bump-ledger rows (schema_up_to_date?, try, try!)"
status: draft
updated: 2026-11-23
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm exec tsx scripts/api-compare/lint-param-names.ts --package listen` (run during trails#10618) reports three STALE signature rows in `scripts/parity/bump-ledger/rails.json`, because the ported signatures now agree with Rails:

- activerecord `tasks/database_tasks.rb:schema_up_to_date?` (rails.json:~1173)
- activesupport `core_ext/object/try.rb:try` (rails.json:~1572)
- activesupport `core_ext/object/try.rb:try!` (rails.json:~1580)

These show up in `pnpm parity:changed` for every package as `params` exit 1.

## Acceptance criteria

- Delete the three stale rows from `scripts/parity/bump-ledger/rails.json`.
- `lint-param-names.ts` reports no STALE rows, and `pnpm parity:changed` has `params` at exit 0.
