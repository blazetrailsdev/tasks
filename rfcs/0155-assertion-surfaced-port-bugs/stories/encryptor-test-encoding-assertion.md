---
title: "encryptor-test-encoding-assertion"
status: blocked
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-24T21:24:13Z"
assignee: "assert-equal-port-does-not-dispatch-ruby-equality"
blocked-by: "A JS string carries no encoding tag and ruby-compat has no encoding-tagged String representation (string/force-encoding.ts transcodes and returns an untagged string), so Rails' decrypted_text.encoding (encryptor_test.rb:88) has nothing to read. The same gap is why trails' Cipher#encrypt/#decrypt omit cipher.rb:17 (headers.encoding = clean_text.encoding.name) and :27 (force_encoding): clean_text.encoding has no JS source. Unblocks when ruby-compat grows an encoding-tagged String seat."
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/encryptor.test.ts` "decrypt respects encoding even when compression is used" only round-trips plaintext. Rails (`vendor/rails/activerecord/test/cases/encryption/encryptor_test.rb:83-89`) forces ISO-8859-1 on the input and asserts `decrypted_text.encoding == Encoding::ISO_8859_1`. JS strings carry no encoding, so the assertion is not mirrored, and `no-freeform-comments` strips any call-site note. Unresolved review comment on trails#7884.

## Acceptance criteria

- Decide how the decrypted value's encoding is observable in trails (Buffer/encoding-tagged result) and assert it as Rails does, or block with the specific language blocker.
- Test name unchanged.
