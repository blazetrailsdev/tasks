---
title: "activerecord: port Encryption::EncryptedFixtures as its own module (un-exclude encrypted_fixtures.rb)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
deps: ["activerecord-unexclude-and-measure-fixtures-rb"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`encryption/encrypted_fixtures.rb` is excluded with "Behavior ported inline into
FixtureSet.createFixtures()". Inlining a module into its host is exactly what `parity:api:extra`'s
inlined-from report and CLAUDE.md § "Decomposition" forbid: `vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encrypted_fixtures.rb`
defines `EncryptedFixtures#initialize`, `#encrypt_fixture_data`, `#process_preserved_original_columns`,
prepended onto `Fixture`.

## Acceptance criteria

- [ ] `packages/activerecord/src/encryption/encrypted-fixtures.ts` holds the module with Rails' three methods, prepended onto `Fixture`; the inline copy in the fixture-creation path is deleted.
- [ ] The unported entry is deleted; `encrypted_fixtures.rb` scores 100% except `initialize` (blocked story).
- [ ] `encryption/encrypted_fixtures_test.rb` stays green.
