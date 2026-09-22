---
title: "encryptor-test-encoding-assertion"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/encryptor.test.ts` "decrypt respects encoding even when compression is used" only round-trips plaintext. Rails (`vendor/rails/activerecord/test/cases/encryption/encryptor_test.rb:83-89`) forces ISO-8859-1 on the input and asserts `decrypted_text.encoding == Encoding::ISO_8859_1`. JS strings carry no encoding, so the assertion is not mirrored, and `no-freeform-comments` strips any call-site note. Unresolved review comment on trails#7884.

## Acceptance criteria

- Decide how the decrypted value's encoding is observable in trails (Buffer/encoding-tagged result) and assert it as Rails does, or block with the specific language blocker.
- Test name unchanged.
