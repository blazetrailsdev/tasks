---
title: "activerecord: Encryption install_support takes no targets, keeps no installed flag, and prepends the modules themselves"
status: in-progress
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat", "trailties"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8665
claim: "2026-10-07T23:04:17Z"
assignee: "collection-association-ids-reader-plucks-through-enumerable-pluck"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-subsystems-part-1` audit while reading the two
`installSupport` receipts. No receipt is re-tagged onto this story; it records the invented shape
around them.

Rails' two `install_support` methods take no arguments and name their targets as constants
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:24-31`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/extended_deterministic_uniqueness_validator.rb:6-8`):

```ruby
def self.install_support
  ActiveRecord::Relation.prepend(RelationQueries)
  ActiveRecord::Base.include(CoreQueries)
  ActiveRecord::Encryption::EncryptedAttributeType.prepend(ExtendedEncryptableType)
end
```

`packages/activerecord/src/encryption/extended-deterministic-queries.ts` and
`extended-deterministic-uniqueness-validator.ts` differ in four ways no language constraint forces:

1. `installSupport(targets)` takes the classes as a parameter (`{ Relation, Base, EncryptedAttributeType }`, `{ UniquenessValidator, EncryptedUniquenessValidator }`). The first file already imports `Relation` and `EncryptedAttributeType`, and `ActiveRecord.Base` / `ActiveRecord.Relation` are call-time seats on `packages/activerecord/src/namespaces.ts`.
2. A private static `_installed` flag makes a second call a no-op. Ruby needs none: prepending a module already in the ancestry is skipped (`vendor/ruby/v3.3.11/class.c:1281-1296`). ruby-compat's `prepend` (`packages/ruby-compat/src/prepend.ts`) wraps again on a second call, which is what the flag papers over. Five test files reset the flag by hand.
3. Both bodies raise an invented `Error` when a target method is not a function.
4. `RelationQueries` and `ExtendedEncryptableType` are classes of static functions taking the original method as a leading argument, re-wrapped by an inline object literal at the `prepend` call, where Rails passes the module itself and its methods call `super`.

Callers: `packages/activerecord/src/cases/helper.ts`, `packages/trailties/src/trailties/active-record.ts`
and the encryption test files.

## Acceptance criteria

- [ ] Both `installSupport` methods take no parameters and their bodies are the Rails lines above, naming the targets as Rails does.
- [ ] `_installed` and the missing-method raises are deleted. A second call is idempotent because `prepend` skips a module already prepended to that target.
- [ ] `RelationQueries` and `ExtendedEncryptableType` are passed to `prepend` as the modules themselves.
- [ ] No test resets a private flag; the trails-only tests that assert the invented raises are deleted.

## Verification

```bash
pnpm vitest run packages/activerecord/src/encryption packages/trailties/src/trailties/active-record.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:calls:args
```
