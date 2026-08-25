---
title: "supportUnencryptedData drops Rails' global config conjunct, letting a per-attribute opt-in defeat the kill-switch"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: encryption/encrypted-attribute-type.ts:143-149 now ANDs Configurable.config.supportUnencryptedData with scheme.isSupportUnencryptedData() and !previousType, matching encrypted_attribute_type.rb:60-62."
---

## Context

Surfaced while reading `encrypted_attribute_type.rb` for PR #6116. Rails:

    def support_unencrypted_data?
      ActiveRecord::Encryption.config.support_unencrypted_data && scheme.support_unencrypted_data? && !previous_type?
    end

(`vendor/rails/activerecord/lib/active_record/encryption/encrypted_attribute_type.rb:60-62`)

trails (`packages/activerecord/src/encryption/encrypted-attribute-type.ts:168-174`)
drops the **first conjunct** entirely:

    get supportUnencryptedData(): boolean {
      if (this._previousType) return false;
      // Mirrors Rails' ... which delegates directly to scheme.support_unencrypted_data?.
      // The scheme already handles the per-attribute override vs global config
      // fallback — no extra AND-gate needed here.
      return this.scheme.isSupportUnencryptedData();
    }

That comment is wrong, and the two are NOT equivalent. `Scheme#support_unencrypted_data?`
is a **fallback**, not a conjunction:

    def support_unencrypted_data?
      @support_unencrypted_data.nil? ? ActiveRecord::Encryption.config.support_unencrypted_data : @support_unencrypted_data
    end

(`scheme.rb:48-50`; trails mirrors this correctly at `scheme.ts:83-85`). So the
global config only participates when the attribute did NOT override it. Rails
re-applies it unconditionally on top; trails does not.

**Divergence:** with `config.support_unencrypted_data = false` and an attribute
declared `encrypts :x, support_unencrypted_data: true`, Rails returns **false**
(the global kill-switch wins) and trails returns **true**. The global flag is
meant to be exactly that — a kill-switch that no per-attribute opt-in can defeat.

Blast radius is not cosmetic: `supportUnencryptedData` gates
`previousSchemesIncludingCleanText`'s clean-text scheme (:186-190) and
`handleDeserializeError`'s decryption-error swallow (:271-273 region), so the
divergence decides whether unencrypted rows are silently readable.

## Converged shape

    get supportUnencryptedData(): boolean {
      return (
        Configurable.config.supportUnencryptedData &&
        this.scheme.isSupportUnencryptedData() &&
        !this._previousType
      );
    }

Keep Rails' conjunct order and the `!previous_type?` arm as the last term rather
than the current early return, so the body reads as the same method. Delete the
incorrect comment.

Note `Configurable.config.supportUnencryptedData` must be read per call (it is
mutable config), which the current recompute-per-call shape already allows.

## Acceptance criteria

- [ ] `supportUnencryptedData` ANDs the global config, matching
      `encrypted_attribute_type.rb:60-62` term for term.
- [ ] A regression cover: global off + attribute-level
      `supportUnencryptedData: true` reports false and does NOT swallow a
      `Decryption` error. Must fail on the pre-change baseline.
- [ ] `unencrypted-attributes.test.ts` and `encryption-schemes.test.ts` green on
      all three lanes.
