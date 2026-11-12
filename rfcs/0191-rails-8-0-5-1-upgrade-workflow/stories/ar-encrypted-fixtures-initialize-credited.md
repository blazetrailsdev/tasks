---
title: "EncryptedFixtures#initialize's inlined segment is credited"
status: done
updated: 2026-11-12
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: trails#10018
claim: "2026-11-12T10:11:37Z"
assignee: "ar-compat-v6-0-table-definition-belongs-to-credited"
blocked-by: null
closed-reason: null
---

## Context

Found by the 8.0.2 entry check (trails `876804dd8b`): `parity:api` reports
`ActiveRecord::Encryption::EncryptedFixtures#initialize` missing from
`encryption/encrypted-fixtures.ts` (2/3).

Rails: `vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encrypted_fixtures.rb:6-11`
(`@clean_values = {}`, `encrypt_fixture_data`,
`process_preserved_original_columns`, `super`), prepended onto
`Fixture` under `encrypt_fixtures` (`railtie.rb:357-362`).

trails already inlines it behind `isModuleIncluded(new.target, EncryptedFixtures)`
in `Fixture`'s constructor (`packages/activerecord/src/fixtures.ts:407-409`)
with an `@inlinedFrom` tag, per CLAUDE.md § "A module installed at run time
is inlined behind a guard". The tag is not crediting the method. Find out why
(the inlined-from manifest condition,
`inlined-from-manifest-follows-included-hook-includes`, or a credit bug)
before changing code.

## Acceptance criteria

- [ ] The cause of the missing credit is named in the PR, and whichever side
      is wrong (the tag, the guard, or `parity:api`'s inlined credit) is fixed.
- [ ] `parity:api` shows `encryption/encrypted_fixtures.rb` at 3/3, and
      `pnpm parity:api:inlined` stays green.
