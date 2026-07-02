---
title: "Wire preserve_original_encrypted for ignore_case on scheme-based encryptAttribute"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced during PR #4407 (encrypt-attribute-converge-scheme-for-declared-new).
Rails `EncryptableRecord#encrypt_attribute`
(activerecord/lib/active*record/encryption/encryptable_record.rb:94) calls
`preserve_original_encrypted(name) if ignore_case` — wiring the
`original*<name>`case-preserving column when an attribute is declared with`ignore_case: true`.

trails' scheme-based `EncryptableRecord.encryptAttribute`
(packages/activerecord/src/encryption/encryptable-record.ts) does NOT call
`preserveOriginalEncrypted` for `ignoreCase` attributes. The method
`preserveOriginalEncrypted` exists on `EncryptableRecord` but is only wired into
the separate encryptor-based `Base.encrypts` path in `encryption.ts`
(`_preserveOriginalEncrypted`, encryption.ts:221), not the scheme-based path.

This predates PR #4407 (unchanged on origin/main) and was left out of scope;
the matching wide call-mismatch exclude entry
(`encrypt_attribute → preserve_original_encrypted`) was intentionally retained.

## Acceptance criteria

- [ ] `EncryptableRecord.encryptAttribute` calls `preserveOriginalEncrypted`
      when the declared options set `ignoreCase: true`, mirroring Rails
      encryptable_record.rb:94.
- [ ] Verify the raise-on-missing-`original_<name>`-column behavior
      (encryptable_record.rb:101-103) fires on this path when
      `support_unencrypted_data` is false.
- [ ] Drop the `encrypt_attribute → preserve_original_encrypted` entry from
      `scripts/api-compare/call-mismatches-wide-exclude.json` once it no longer
      flags.
- [ ] Port/verify the relevant Rails `ignore_case` encryption test(s).
