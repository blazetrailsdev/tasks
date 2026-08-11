---
title: "Converge the explicit-host argument in ported encryption module functions (13 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 156
priority: null
pr: 6380
claim: "2026-08-11T21:46:04Z"
assignee: "converge-association-build-record-build-association"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 13 rows across 2 files.

Rails calls these as methods on a receiver (`klass.polymorphic_name`, `assoc.through_reflection`); the trails port calls the module function with the host passed as an explicit first argument, so the argument lists differ by one leading ref. CLAUDE.md's settled mixin idiom is a `this`-typed function assigned to the class, which keeps the call spelled `Klass.polymorphicName()` and the argument list identical to Rails. Converge each site to that shape (or to a plain method call on the host) and delete the corresponding baseline row.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `encryption/encryptable-record.ts` `ciphertext_for` → `encrypted_attribute?`: Rails (`encryption/encryptable_record.rb`) `(ref:attributeName)` vs trails `(ref:record, ref:attributeName)`
- `encryption/encryptable-record.ts` `decrypt` → `decrypt_attributes`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:record)`
- `encryption/encryptable-record.ts` `decrypt` → `has_encrypted_attributes?`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:constructor)`
- `encryption/encryptable-record.ts` `decrypt_attributes` → `build_decrypt_attribute_assignments`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:record)`
- `encryption/encryptable-record.ts` `decrypt_attributes` → `validate_encryption_allowed`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:record)`
- `encryption/encryptable-record.ts` `deterministic_encrypted_attributes` → `encrypted_attributes`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:modelClass)`
- `encryption/encryptable-record.ts` `encrypt` → `encrypt_attributes`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:record)`
- `encryption/encryptable-record.ts` `encrypt` → `has_encrypted_attributes?`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:constructor)`
- `encryption/encryptable-record.ts` `encrypt_attribute` → `preserve_original_encrypted`: Rails (`encryption/encryptable_record.rb`) `(ref:name)` vs trails `(ref:modelClass, ref:name)`
- `encryption/encryptable-record.ts` `encrypt_attributes` → `build_encrypt_attribute_assignments`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:record)`
- `encryption/encryptable-record.ts` `encrypt_attributes` → `validate_encryption_allowed`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:record)`
- `encryption/encryptable-record.ts` `encrypted_attribute?` → `encrypted_attributes`: Rails (`encryption/encryptable_record.rb`) `()` vs trails `(ref:klass)`
- `encryption/encryptor.ts` `compress_if_worth_it` → `compress?`: Rails (`encryption/encryptor.rb`) `()` vs trails `(ref:clearText)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
