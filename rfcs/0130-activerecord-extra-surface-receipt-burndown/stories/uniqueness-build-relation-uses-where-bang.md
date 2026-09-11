---
title: "uniqueness-build-relation-uses-where-bang"
status: done
updated: 2026-09-11
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#7715
claim: "2026-09-11T18:50:22Z"
assignee: "converge-loader-query-eql-and-hash-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails' `UniquenessValidator#build_relation` finishes with `relation.where!(comparison)`
(`vendor/rails/activerecord/lib/active_record/validations/uniqueness.rb:131`). `where!` is not
prepended by `ExtendedDeterministicQueries::RelationQueries` (which prepends `where`,
`extended_deterministic_queries.rb:24-31`), so in Rails the uniqueness query is NOT expanded to
previous ciphertexts, and `EncryptedUniquenessValidator#validate_each`
(`extended_deterministic_uniqueness_validator.rb:11-23`) unconditionally re-runs `super` once per
previous type under `without_encryption`.

trails' `packages/activerecord/src/validations/uniqueness.ts` builds the relation with
`base.where({ [attribute]: value })` (lines ~176-219), which DOES go through the extended-queries
prepend. To avoid double-counting, `EncryptedUniquenessValidator.validateEach`
(`packages/activerecord/src/encryption/extended-deterministic-uniqueness-validator.ts`) branches on
`ExtendedDeterministicQueries.installed` and passes all previous ciphertexts as one array. That
branch is why the public `ExtendedDeterministicQueries.installed` getter exists; it carries
`@noRailsEquivalent CONVERGEABLE uniqueness-build-relation-uses-where-bang`.

Converging only the validator (per-type loop, no guard) was tried in
receipt-encryption-and-type-virtualization and reds three tests in
`encryption/uniqueness-validations.test.ts` (errors.count 2 vs 1), because the expanded `where`
already matches.

## Acceptance criteria

- `uniqueness.ts` build_relation ends in `whereBang` (or the trails spelling of `where!`) as at
  `uniqueness.rb:131`, so the extended-queries prepend does not apply.
- `EncryptedUniquenessValidator.validateEach` mirrors `extended_deterministic_uniqueness_validator.rb:11-23`:
  loop `previousTypes`, `serialize`, `withoutEncryption` super per type — no `installed` branch.
- `ExtendedDeterministicQueries.installed` getter and its receipt are deleted.
- `encryption/uniqueness-validations.test.ts` stays green.
