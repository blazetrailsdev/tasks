---
title: "Rotate the signed and encrypted jars over request.cookies_rotations"
status: done
updated: 2026-09-08
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#7600
claim: "2026-09-08T00:10:55Z"
assignee: "rotate-cookie-jar-verifier-and-encryptor-over-cookies-rotations"
blocked-by: null
closed-reason: null
---

## Context

`SignedKeyRotatingCookieJar#initialize` and `EncryptedKeyRotatingCookieJar#initialize`
rotate their verifier/encryptor over `request.cookies_rotations`:

```ruby
request.cookies_rotations.signed.each do |(*secrets)|
  options = secrets.extract_options!
  @verifier.rotate(*secrets, serializer: SERIALIZER, **options)
end
# actionpack/lib/action_dispatch/middleware/cookies.rb:620-622
```

and the encrypted jar additionally rotates for the two legacy-upgrade paths
(`cookies.rb:665-680`), guarded by `upgrade_legacy_hmac_aes_cbc_cookies?` /
`prepare_upgrade_legacy_hmac_aes_cbc_cookies?` (`cookies.rb:290-301`).

PR #7598 ported both constructors onto `MessageVerifier` / `MessageEncryptor`
with secrets derived from `request.key_generator`, but omitted every `rotate`
call: `packages/actionpack/src/action-dispatch/middleware/cookies.ts` has no
`cookies_rotations` reader beyond the env accessor `cookiesRotations`, and
trails has no `ActiveSupport::Messages::RotationConfiguration` for it to
return. The two predicates the upgrade blocks guard ARE ported (they are the
`ChainedCookieJars` privates) and currently have no caller in the jars.

The reader half is the other half of the same gap: Rails' `parse` passes
`on_rotation: -> { rotated = true }` and then `super(name, data,
force_reserialize: rotated)` (`cookies.rb:628-632`, `:684-690`). #7598 wired
`force_reserialize` through `SerializedCookieJars#parse` but has no rotation to
feed it, so the parameter is only ever the default today.

## Acceptance criteria

- [ ] `ActiveSupport::Messages::RotationConfiguration` is available (ported or
      identified as already present) and `request.cookies_rotations` returns one.
- [ ] Both jar constructors rotate over it per `cookies.rb:620-622` and
      `:659-661`.
- [ ] The encrypted jar's two legacy-upgrade `rotate` blocks land, calling the
      already-ported `isUpgradeLegacyHmacAesCbcCookies` /
      `isPrepareUpgradeLegacyHmacAesCbcCookies`.
- [ ] `parse` passes `onRotation` and forwards the result as
      `forceReserialize`, per `cookies.rb:628-632` and `:684-690`.
- [ ] Both call gates green with no new baseline rows.
