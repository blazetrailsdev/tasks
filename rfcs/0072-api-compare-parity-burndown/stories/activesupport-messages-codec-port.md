---
title: "Port Messages::Codec and route MessageEncryptor/MessageVerifier through SerializerWithFallback"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 5353
claim: "2026-07-26T14:38:58Z"
assignee: "activesupport-messages-codec-port"
blocked-by: null
closed-reason: null
---

## Context

PR #5351 ported `messages/serializer_with_fallback.rb` (8/8 in `api:compare`)
but nothing consumes it: `messages/codec.rb` — the class that turns a
`serializer:` symbol into a serializer via
`SerializerWithFallback[@serializer]`
(`vendor/rails/activesupport/lib/active_support/messages/codec.rb:16-20`) and
holds `class_attribute :default_serializer, default: :marshal`
(`codec.rb:12`) — has no TS counterpart.

Instead `MessageEncryptor` and `MessageVerifier` each keep their own
`serializer` field defaulting to a bespoke `JSONSerializer`
(`packages/activesupport/src/message-encryptor.ts:63`,
`packages/activesupport/src/message-verifier.ts:59`) and accept only a
serializer object, never Rails' `:marshal` / `:json` /
`:message_pack_allow_marshal` symbols. `Codec`'s private
`encode`/`decode`/`serialize`/`deserialize` (`codec.rb:25-41`) are likewise
open-coded in both classes.

## Acceptance criteria

- Port `messages/codec.rb` to `packages/activesupport/src/messages/codec.ts`,
  including `default_serializer` and the symbol → `SerializerWithFallback[...]`
  resolution.
- Reroute `MessageEncryptor` / `MessageVerifier` through it so a
  `serializer:` symbol selects one of the five with-fallback serializers,
  replacing the bespoke `JSONSerializer` default with Rails' `:marshal`
  default (or justify keeping `:json` at the call site).
- Existing message-encryptor / message-verifier tests keep passing, and
  `pnpm api:compare --package activesupport` shows a non-negative delta.
