---
title: "Rack::Session::Encryptor#serialize_payload drops the invented JSON b() arm"
status: draft
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Session::Encryptor#serialize_payload`
(`vendor/rack-session/v2.1.0/lib/rack/session/encryptor.rb:167-178`)
interpolates `[padding_bytes].pack('v')`, `SecureRandom.random_bytes` and
`serializer.dump(message)`. MRI raises `Encoding::CompatibilityError` when the
JSON dump is non-ASCII UTF-8 and the padding holds a byte >= 0x80 (I checked this
with ruby 3.3). trails' `packages/rack-session/src/encryptor.ts`
`serializePayload` keeps an invented arm, `this.serializer === JSON ? b(dumped) : dumped`,
so the trails-only test `round-trips non-ASCII under serialize_json`
(`encryptor.trails.test.ts`) passes where Ruby would raise.

## Acceptance criteria

- `serializePayload` concatenates `serializer.dump(message)` with no `b()` arm,
  through `rbStrPlus`, which applies `rb_enc_check` (`encoding.c:1038`) as Ruby does.
- The trails-only round-trip test is brought in line with Ruby's behaviour, or
  is parked with a citation to the MRI raise. The owner decides which.
