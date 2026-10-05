---
title: "activerecord: encryption serializers' load / decode_if_needed guards move into JSON.parse, feed_reference and Base64.strict_decode64"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activerecord-converge-invented-control-flow-arms-encryption-part-2` removed 41 of the 49 invented
branches in the encryption serializers, key providers, properties and scheme. Three rows stay in
`pnpm parity:api:arms:report --package=activerecord --direction=invented`, each because the guard
stands in for a `TypeError` / `ArgumentError` the Ruby stdlib call raises itself and its JS
counterpart does not:

- `encryption/message-serializer.ts#load` — `+if +throw`. Rails is
  `data = JSON.parse(serialized_content)` under `rescue JSON::ParserError`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/message_serializer.rb:24-29`);
  `JSON.parse(:sym)` raises `TypeError`, which
  `vendor/rails/v8.0.2/activerecord/test/cases/encryption/message_serializer_test.rb:50-54` asserts.
  JS `JSON.parse(42)` coerces, so the port carries `if (typeof serializedContent !== "string") throw
new TypeError(...)`. ruby-compat's `JSON` (`packages/ruby-compat/src/json.ts`) has `dump` / `load`
  and no `parse` / `ParserError`. The port also raises `Decryption` where Rails raises
  `Errors::Encoding`.
- `encryption/message-pack-message-serializer.ts#load` — `+if +throw`. Rails is
  `ActiveSupport::MessagePack.load(serialized_content)` under `rescue RuntimeError`
  (`message_pack_message_serializer.rb:27-32`); the `TypeError`
  (`message_pack_message_serializer_test.rb:38-42`) comes from the unpacker's `feed_reference`.
  trails' `Unpacker#feedReference` (`packages/activesupport/src/message-pack/factory.ts:205`) takes
  anything.
- `encryption/message-serializer.ts#decodeIfNeeded` — `+if +throw +throw`. Rails is
  `::Base64.strict_decode64(value)` under `rescue ArgumentError, TypeError` raising
  `Errors::Encoding` (`message_serializer.rb:82-90`). ruby-compat's `Base64`
  (`packages/ruby-compat/src/base64.ts`) has only `strictEncode64`, so the port re-encodes and
  compares by hand and raises `Decryption`. `port-array-pack-strict-base64-directive` is the
  `unpack("m0")` this needs.

`encryption/encryptor.ts#forceEncodingIfNeeded` keeps one `+if` (the max-code-point ternary handed
to `replaceUnencodable`); that one is owned by
`encryption-encoding-helpers-fold-into-string-encode-and-header-reads`.

## Acceptance criteria

- [ ] ruby-compat `JSON.parse` raises `TypeError` for a non-String and `JSON::ParserError` for
      malformed input; `MessageSerializer#load` is Rails' two lines under
      `rescue JSON::ParserError` raising `Errors::Encoding`, with no `typeof` guard.
- [ ] `Unpacker#feedReference` raises `TypeError` for a non-String, and
      `MessagePackMessageSerializer#load` drops its `typeof` guard.
- [ ] ruby-compat `Base64.strictDecode64` raises `ArgumentError` on invalid input;
      `decodeIfNeeded` is Rails' body, raising `Errors::Encoding`. `encodeIfNeeded` calls
      `Base64.strictEncode64`.
- [ ] The invented-direction arms report shows no row for these three methods.
