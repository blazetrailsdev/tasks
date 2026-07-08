---
title: "illegal-migration-name-error-message-rails-suffix"
status: claimed
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-07-08T11:01:23Z"
assignee: "illegal-migration-name-error-message-rails-suffix"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4735
(migrator-validate-scope-to-name-version-dup-only), which made
`IllegalMigrationNameError` reachable for the first time (raised from
`fromPath`/`discoverMigrations` on an unparseable migration filename).

trails' `IllegalMigrationNameError` message
(packages/activerecord/src/migration.ts:160-165) is:

    `Illegal name for migration file: ${name}.`

Rails' message (vendor/rails/activerecord/lib/active_record/migration.rb:124)
carries an explanatory suffix:

    "Illegal name for migration file: #{name}\n\t(only lower case letters, numbers, and '_' allowed)."

This is a pre-existing gap in the error class (not introduced by #4735).

## Acceptance criteria

- [ ] `IllegalMigrationNameError`'s message matches Rails byte-for-byte
      (modulo Ruby heredoc/interpolation vs TS template literal):
      the `\n\t(only lower case letters, numbers, and '_' allowed).` suffix.
- [ ] Add/adjust a test asserting the full message.
- [ ] No regression in migrator/migration tests.
