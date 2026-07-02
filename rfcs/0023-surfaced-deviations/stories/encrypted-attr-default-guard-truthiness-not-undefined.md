---
title: "encrypted-attr-default-guard-truthiness-not-undefined"
status: done
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4444
claim: "2026-07-02T21:57:50Z"
assignee: "encrypted-attr-default-guard-truthiness-not-undefined"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4442
(encrypt-column-default-source-true-column-not-attribute-override).

`EncryptedAttributeType.decryptAsText`'s plaintext-default short-circuit guard
is `this._default !== undefined && this._default === value`
(packages/activerecord/src/encryption/encrypted-attribute-type.ts:242).

Rails' guard is `@default && @default == value`
(vendor/rails/activerecord/lib/active_record/encryption/encrypted_attribute_type.rb:87).

Deviation: Ruby's `@default &&` is a truthiness check, so a falsey column
default — notably an empty-string default `""` (also `false`) — is treated as
ABSENT, and the value is NOT short-circuited (Rails would attempt to
decrypt/deserialize it). trails' `!== undefined` treats `""`/`false`/`0` as a
present default and short-circuits, returning the plaintext as-is.

Observable only for an encrypted column whose true DB default is a falsey value
(e.g. `default: ""`). No such encrypted column exists in the suite today, so the
divergence is currently inert.

## Acceptance criteria

- [ ] `decryptAsText`'s default guard matches Rails' truthiness semantics
      (`@default && @default == value`): a falsey default (`""`, `false`) is
      treated as absent and does NOT short-circuit the decrypt path.
- [ ] Regression test: encrypted attribute with an empty-string column default
      does not short-circuit on a non-empty stored value; matches Rails.
- [ ] No regression to encryptable-record.test.ts / contexts.test.ts.
