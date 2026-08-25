---
title: "converge-fixtures-encrypted-attributes-present"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6495
claim: "2026-08-13T21:57:10Z"
assignee: "converge-fixtures-encrypted-attributes-present"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the review of PR #6380 (`call-args-ar-host-param-encryption`).

Rails' `has_encrypted_attributes?`
(`activerecord/lib/active_record/encryption/encryptable_record.rb:204-206`) is a
private INSTANCE method on the record:

```ruby
def has_encrypted_attributes?
  self.class.encrypted_attributes.present?
end
```

PR #6380 converged it to a `this`-typed function whose `this` is the record, so
the calls in `encrypt` / `decrypt` (`:166-173`) read as Rails writes them.

Both `fixtures.ts` call sites, however, hold a model CLASS, not a record — the
retired static `EncryptableRecord.hasEncryptedAttributes(modelClass)` took a
class, which never matched Rails' receiver. Rather than keep the class-taking
shape alive, #6380 inlined the predicate's body at the two sites:

- `packages/activerecord/src/fixtures.ts:746` — `encryptedAttributes.call(ModelClass)`
- `packages/activerecord/src/fixtures.ts:1260` — `encryptedAttributes.call(ModelClass).size > 0`

The second is a one-line duplicate of `has_encrypted_attributes?`'s body.

Rails' own fixture path reads `model_class.encrypted_attributes` directly
(`encryption/encrypted_fixtures.rb:15,27`) and never calls the predicate, so the
inline read is defensible — but the `.size > 0` spelling is trails' `present?`
and the duplication is worth retiring.

## Acceptance criteria

1. `fixtures.ts:1260` reads the encrypted-attribute set the way
   `encrypted_fixtures.rb:15` does, or through an ActiveSupport `present?`
   analogue — not a hand-rolled `.size > 0` copy of
   `has_encrypted_attributes?`'s body.
2. No class-taking `hasEncryptedAttributes` is reintroduced; the predicate stays
   record-hosted, matching `encryptable_record.rb:204-206`.
3. `pnpm parity:api:calls` / `pnpm parity:api:calls:args` stay green; no new
   baseline rows.
