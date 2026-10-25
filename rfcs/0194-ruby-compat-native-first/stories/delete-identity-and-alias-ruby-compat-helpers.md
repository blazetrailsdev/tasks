---
title: "Delete the identity strUminus and the duplicate hash inspect export"
status: ready
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: deletion
packages: ["ruby-compat", "activerecord", "scripts"]
deps: []
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two ruby-compat exports are a JS form already. No RFC 0194 sweep names them:

- `strUminus` (`packages/ruby-compat/src/string/support.ts`) is
  `return str`. Ruby's `String#-@` answers a frozen, deduplicated copy
  (`vendor/ruby/v3.3.11/string.c`, `str_uminus`). A JS string is immutable and
  has no identity (CLAUDE.md § "Ruby Strings are JS string primitives"), so
  `-str` ports as `str`. It has 13 call sites, all in activerecord:
  `connection-adapters/column.ts:131,133-136`,
  `connection-adapters/sql-type-metadata.ts:76`,
  `connection-adapters/mysql/type-metadata.ts:55` and
  `test-fixtures.ts:99-101`. They port Rails' `-name` dedup in
  `Column#initialize` / `deduplicated` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/column.rb`)
  and `TestFixtures` (`test_fixtures.rb`).
- hash `inspect` (`packages/ruby-compat/src/hash.ts`) is
  `return rbInspect(hash)`, a second export name for one function, with 2
  importing files.

The call-set gate must still credit the Rails `-@` calls once they are
omitted. `freeze`, the other no-op on a string, is already credited that way
(`scripts/api-compare/lint-calls.ts:206`).

## Acceptance criteria

- [ ] Each export this PR deletes or unexports also loses its row in
      `packages/ruby-compat/README.md`'s export table.
- [ ] Every `strUminus(x)` call becomes `x`, and `strUminus` is deleted from
      `string/support.ts` and `index.ts`. Grep the hits before any regex
      rewrite: a bulk rewrite also catches test titles and sibling calls.
- [ ] If dropping the call raises a call-gate row for Rails' `-@`, `-@` on a
      string receiver is credited as an omitted call in `lint-calls.ts`,
      beside `freeze`. `pnpm parity:api:calls` and
      `parity:api:calls:args` are green, with no new baseline row.
- [ ] hash `inspect`'s importers call `rbInspect`, and the alias is deleted.
- [ ] `pnpm parity:api:extra:gate` is green; tighten the ruby-compat mark if
      it fell.
