---
title: "wire-cookie-jar-parse-purpose-into-verify-and-decrypt"
status: in-progress
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7598
claim: "2026-09-07T19:26:54Z"
assignee: "port-chained-cookie-jars-module-and-memoize-the-readers"
blocked-by: null
closed-reason: null
---

## Context

`AbstractCookieJar#[]` threads a purpose through to the concrete jars'
`parse` hook:

```ruby
def [](name)
  if data = @parent_jar[name.to_s]
    result = parse(name, data, purpose: "cookie.#{name}")
    ...
# actionpack/lib/action_dispatch/middleware/cookies.rb:513-520
```

and each serialized jar binds it into the verifier/encryptor call:

```ruby
def parse(name, signed_message, purpose: nil)
  rotated = false
  data = @verifier.verified(signed_message, purpose: purpose, on_rotation: -> { rotated = true })
  super(name, data, force_reserialize: rotated)
end
# cookies.rb:628-632 (signed); :684-690 (encrypted)
```

That purpose string is what stops a signature or ciphertext minted for one
cookie name being replayed under another.

PR #7595 ported the two-phase `[]` (purpose first, bare `parse` as the fallback,
`cookies.rb:513-520`), so `packages/actionpack/src/action-dispatch/middleware/cookies.ts`
now HAS the purpose at the `parse` call site — but `SignedCookieJar#parse` and
`EncryptedCookieJar#parse` declare it `_purpose` and drop it, because trails'
`sign`/`verify` and `encrypt`/`decrypt` in that file are bare HMAC and
AES-CBC helpers with no purpose/metadata parameter at all. Rails carries the
purpose in `ActiveSupport::Messages::Metadata`, which trails has not ported
into this path; there is no `MessageVerifier`/`MessageEncryptor` seam here to
pass it to. The gap predates #7595 (nothing read a purpose before either) —
what #7595 added is the plumbing that makes it visible.

Surfaced in review of #7595.

## Acceptance criteria

- [ ] `SignedCookieJar#parse` passes its `purpose` into verification and
      `EncryptedCookieJar#parse` into decryption, per `cookies.rb:628-632`
      and `:684-690`.
- [ ] The write half binds the same purpose, per `cookie_metadata`
      (`cookies.rb:546-550`) and the `commit` bodies at `:640-643` / `:694-697`.
- [ ] A test pins that a value signed/encrypted under one cookie name does
      not verify under another.
- [ ] Neither `parse` hook takes an underscore-prefixed `purpose` any more.
- [ ] Both call gates green with no new baseline rows.
