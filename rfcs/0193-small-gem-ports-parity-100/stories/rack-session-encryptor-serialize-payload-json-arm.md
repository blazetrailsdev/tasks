---
title: "rack-session-encryptor-serialize-payload-json-arm"
status: draft
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
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

`Rack::Session::Encryptor#serialize_payload` (`vendor/rack-session/v2.1.0/lib/rack/session/encryptor.rb:168-177`) interpolates `"#{[padding_bytes].pack('v')}#{padding_data}#{serialized_data}"`. The trails port (`packages/rack-session/src/encryptor.ts` `serializePayload`) keeps `this.serializer === JSON ? b(dumped) : dumped` before `rbStrPlus`. Without that arm, `rbStrPlus` (`rb_enc_check`, `vendor/ruby/v3.3.11/encoding.c:1038`) raises `incompatible character encodings` when non-ASCII JSON meets high-byte padding. Ruby's interpolation raises in the same case, so the trails test "round-trips non-ASCII under serialize_json" asserts behaviour Ruby does not have. Surfaced in trails#9278.

## Acceptance criteria

- Ruby's behaviour for non-ASCII JSON with `serialize_json` is checked with vendored rack-session (`ruby -Ivendor/rack-session/v2.1.0/lib -Ivendor/rack/v3.1.14/lib`).
- The `b()` arm is removed and `serializePayload` reads line-for-line with `encryptor.rb:168-177`; the trails test is corrected to Ruby's behaviour (or the arm is receipted against a ratified section if Ruby never reaches the raise).
