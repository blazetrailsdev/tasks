---
title: "Thread column schema default into EncryptedAttributeType (Rails columns_hash default)"
status: done
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4435
claim: "2026-07-02T19:09:50Z"
assignee: "encrypt-thread-column-default-into-encrypted-type"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #4418 (encrypt-unify-declaration-paths-onto-scheme).

Rails' `EncryptableRecord::ClassMethods#encrypt_attribute` constructs the
encrypted type with the column's schema default:

```ruby
# vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:86
ActiveRecord::Encryption::EncryptedAttributeType.new(
  scheme: scheme, cast_type: cast_type, default: columns_hash[name.to_s]&.default)
```

trails omits the `default:` argument on BOTH declaration paths — it constructs
`new EncryptedAttributeType({ scheme, castType })` with no `default`:

- `packages/activerecord/src/encryption/encryptable-record.ts` —
  `EncryptableRecord.registerEncryptedType` (both the `decorateAttributes`
  branch and the direct-set branch).

This gap pre-dates PR #4418 (present on both paths before the refactor); the
consolidation into `registerEncryptedType` did not change it, only centralized
the construction site. It is not tracked anywhere else.

Impact: an encrypted attribute whose column carries a schema default does not
receive that default through the `EncryptedAttributeType`. Reflection-only
encrypted models with a column default (e.g. canonical `encrypted_books.name`
= `<untitled>`) also hit a related deserialize snag when the plaintext default
flows through the encrypted type — observed while writing the PR #4418 replay
test (worked around by declaring the attribute without a default).

## Acceptance criteria

- [ ] `registerEncryptedType` threads the column's schema default into
      `new EncryptedAttributeType({ scheme, castType, default })`, mirroring
      Rails `columns_hash[name]&.default`.
- [ ] `EncryptedAttributeType` honors the default (verify a reflection-only
      encrypted model with a column default round-trips: the default is applied
      and does not fail deserialization).
- [ ] Regression test for an encrypted attribute with a column default.
- [ ] All encryption tests green; no api:compare / call-mismatch regressions.
