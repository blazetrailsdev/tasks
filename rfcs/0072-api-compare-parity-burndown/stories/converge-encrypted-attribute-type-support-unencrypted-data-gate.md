---
title: "EncryptedAttributeType#support_unencrypted_data? drops Rails' global config conjunct"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6131
claim: "2026-08-05T15:41:05Z"
assignee: "row-write-ratchet-misses-implicit-model-level-writes"
blocked-by: null
closed-reason: null
---

## Context

`EncryptedAttributeType#supportUnencryptedData`
(`packages/activerecord/src/encryption/encrypted-attribute-type.ts`) drops the
first conjunct of Rails':

    def support_unencrypted_data?
      ActiveRecord::Encryption.config.support_unencrypted_data && scheme.support_unencrypted_data? && !previous_type?

(`vendor/rails/activerecord/lib/active_record/encryption/encrypted_attribute_type.rb:61-63`)

trails answers `!previousType && scheme.isSupportUnencryptedData()`, with a call-site
comment claiming "the scheme already handles the per-attribute override vs global
config fallback — no extra AND-gate needed here". It does not. `Scheme#support_unencrypted_data?`
(`scheme.rb:48-50`) is:

    @support_unencrypted_data.nil? ? ActiveRecord::Encryption.config.support_unencrypted_data : @support_unencrypted_data

— the global config is the fallback ONLY when the attribute set nothing. When the
attribute set it explicitly, Rails still AND-gates it against the global config and
trails does not.

So `encrypts :name, support_unencrypted_data: true` under a global
`config.support_unencrypted_data = false` answers **true** in trails and **false**
in Rails. That flips `previousSchemesIncludingCleanText` (a clean-text scheme is
appended that Rails would not append) and `handleDeserializeError` (a `Decryption`
error is swallowed and the ciphertext returned as clear text where Rails re-raises)
— a fail-open divergence on the security-relevant path.

Surfaced while restoring Rails' `@previous_types` memo in PR #6126, which keys on
this predicate.

## Converged shape

Port the Ruby conjunction verbatim, config conjunct first, and delete the call-site
comment asserting the gate is redundant:

    get supportUnencryptedData(): boolean {
      return (
        Configurable.config.supportUnencryptedData &&
        this.scheme.isSupportUnencryptedData() &&
        !this._previousType
      );
    }

Note the ORDER matters for the `previous_type?` arm too — Rails puts it last.

## Acceptance criteria

- [ ] `supportUnencryptedData` reads `config.supportUnencryptedData` as its first conjunct.
- [ ] A test pins the divergent case: explicit `supportUnencryptedData: true` on the
      attribute + global `false` answers `false`, and the deserialize path re-raises
      `Decryption` rather than returning the ciphertext.
- [ ] The "no extra AND-gate needed here" comment is gone.
