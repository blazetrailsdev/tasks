---
title: "encryptor-test-encoding-assertion"
status: closed
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-24T21:24:13Z"
assignee: "assert-equal-port-does-not-dispatch-ruby-equality"
blocked-by: null
closed-reason: 'PERMANENT: a JS string has no encoding tag, so decrypted_text.encoding has nothing to read (trails CLAUDE.md § "Ruby Strings are JS string primitives", "A String has no encoding tag either").'
---

## Context

`packages/activerecord/src/encryption/encryptor.test.ts` "decrypt respects encoding even when compression is used" only round-trips plaintext. Rails (`vendor/rails/activerecord/test/cases/encryption/encryptor_test.rb:83-89`) forces ISO-8859-1 on the input and asserts `decrypted_text.encoding == Encoding::ISO_8859_1`. JS strings carry no encoding, so the assertion is not mirrored, and `no-freeform-comments` strips any call-site note. Unresolved review comment on trails#7884.

## Acceptance criteria

- Decide how the decrypted value's encoding is observable in trails (Buffer/encoding-tagged result) and assert it as Rails does, or block with the specific language blocker.
- Test name unchanged.
