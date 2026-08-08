---
title: "message-encryptor-marshal-payload-backwards-compatibility"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6223
claim: "2026-08-08T09:51:55Z"
assignee: "message-encryptor-marshal-payload-backwards-compatibility"
blocked-by: null
closed-reason: null
---

## Context

Rails' `test_backwards_compatibility_decrypt_previously_encrypted_messages_without_metadata`
(`vendor/rails/activesupport/test/message_encryptor_test.rb:148-154`) decrypts a
message produced before message metadata existed:

```ruby
encryptor = ActiveSupport::MessageEncryptor.new(secret, cipher: "aes-256-gcm")
encryptor.decrypt_and_verify("9cVnFs2O3lL9SPvIJuxBOLS51nDiBMw=--YNI5HAfHEmZ7VDpl--ddFJ6tXA0iH+XGcCgMINYQ==")
# => "Ruby on Rails"
```

The payload is a **Marshal**-serialized string. trails defaults
`MessageEncryptor.defaultSerializer` to `"json"`
(`packages/activesupport/src/message-encryptor.ts:35`) and
`SerializerWithFallback` has no Marshal reader, so the decrypt reaches
`InvalidMessage: Unsupported serialization format`.

The case is `it.skip`ped in
`packages/activesupport/src/message-encryptor.test.ts` with a pointer here.

## Acceptance criteria

- [ ] Decide and record whether trails reads Ruby Marshal payloads at all
      (`SerializerWithFallback.get("marshal")` is currently a JSON stand-in).
- [ ] Either the case is un-skipped and passes, or it is recorded in
      `SKIP_GROUPS` with the Ruby-Marshal reason — not left as a bare skip.
