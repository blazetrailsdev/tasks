---
title: "pass Rails' digest/serializer/url_safe kwargs when building the signed-id verifier"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6476
claim: "2026-08-13T16:55:39Z"
assignee: "attribute-set-coder-rename-to-yaml-encoder"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the RFC 0096 receiver rows in #6469. This is a live
`shape` row in `call-arg-mismatches.json`:

| rubyFile       | rubyName             | call  | rubyArgs                                                                            | tsArgs                                                               |
| -------------- | -------------------- | ----- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `signed_id.rb` | `signed_id_verifier` | `new` | `ref:secret`, `kwargs{digest=str:SHA256, serializer=const:JSON, urlSafe=bool:true}` | `ref:resolvedSecret`, `kwargs{digest=str:sha256, urlSafe=bool:true}` |

Rails (`activerecord/lib/active_record/signed_id.rb:74-80`):

```ruby
def signed_id_verifier
  @signed_id_verifier ||= begin
    secret = signed_id_verifier_secret
    secret = secret.call if secret.respond_to?(:call)
    ...
    ActiveSupport::MessageVerifier.new(secret, digest: "SHA256", serializer: JSON, url_safe: true)
  end
end
```

Two divergences in one call:

1. **`serializer: JSON` is dropped.** The TS `MessageVerifier` is constructed
   without it, so it falls back to whatever its own default serializer is
   rather than the JSON serializer Rails pins. This is behavioural: it decides
   the on-the-wire signed-id payload format.
2. **`digest` is `"sha256"`, not `"SHA256"`.** Rails passes the OpenSSL digest
   name in uppercase. Whether the TS digest lookup is case-insensitive needs
   checking — if it is, the fix is cosmetic; if it is not, only one of the two
   spellings resolves.

## Converged shape

`signedIdVerifier` (`packages/activerecord/src/signed-id.ts`) constructs the
verifier with all three kwargs Rails passes, in Rails' order and with Rails'
literal values, and names its local `secret` rather than `resolvedSecret`
(`signed_id.rb:76`).

## Acceptance criteria

- [ ] The `new` call in `signedIdVerifier` passes `digest`, `serializer` and
      `urlSafe` with Rails' values.
- [ ] The local is named `secret`.
- [ ] The `shape` row for `signed_id.rb#signed_id_verifier` is gone from
      `pnpm parity:api:calls:args:report`, with no baseline row added.
- [ ] `signed-id.test.ts` passes on all three adapters; if the serializer
      change alters the signed-id payload, the round-trip tests must still pass
      because both sides move together.
