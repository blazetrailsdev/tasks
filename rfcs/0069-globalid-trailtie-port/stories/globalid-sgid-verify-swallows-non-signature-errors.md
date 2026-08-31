---
title: "globalid: SGID verify helper swallows every error, not just InvalidSignature"
status: claimed
updated: 2026-08-31
rfc: "0069-globalid-trailtie-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: "2026-08-31T14:32:02Z"
assignee: "globalid-railtie-to-trailtie"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while reconciling globalid's extra surface (#5333).

Rails' `SignedGlobalID.verify_with_verifier_validated_metadata`
(`vendor/globalid/lib/global_id/signed_global_id.rb:34-38`) rescues exactly one
error class:

```ruby
def verify_with_verifier_validated_metadata(sgid, options)
  pick_verifier(options).verify(sgid, purpose: pick_purpose(options))
rescue ActiveSupport::MessageVerifier::InvalidSignature
  nil
end
```

`packages/globalid/src/signed-global-id.ts`'s
`verifyWithVerifierValidatedMetadata` wraps its whole body in a bare
`try { … } catch { return null }`, so **every** error becomes "invalid token":
`pick_verifier`'s missing-verifier `ArgumentError`, a `Temporal.Instant.from`
parse failure on a malformed `expires_at`, and any future programming error in
the body. Rails lets all of those propagate.

PR #5333 patched the one caller-visible symptom — `SignedGlobalID.parse` now calls
`pickVerifier(options)` up front so a missing verifier still raises, covered by
`parse raises when no verifier is configured` in
`signed-global-id.trails.test.ts` — but the helper itself still swallows
everything, so any other non-signature failure is still silently reported as a
null parse.

## Acceptance criteria

- `verifyWithVerifierValidatedMetadata` catches only the signature-invalid case
  (the `InvalidSignature` analogue raised by
  `packages/activesupport/src/message-verifier.ts`), letting other errors
  propagate as Rails does.
- Check whether the upfront `pickVerifier` assert in `SignedGlobalID.parse`
  becomes redundant once the helper stops swallowing; if so, remove it and keep
  the regression test green.
- A test covers a non-signature failure (e.g. a signed payload whose
  `expires_at` is not a parseable instant) raising rather than returning null.
- `packages/globalid/src/*.test.ts` pass; test names unchanged.
