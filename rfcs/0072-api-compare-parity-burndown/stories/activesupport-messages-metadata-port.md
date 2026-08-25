---
title: "Port Messages::Metadata and make Codec's metadata options load-bearing"
status: done
updated: 2026-07-30
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 5632
claim: "2026-07-30T12:45:04Z"
assignee: "activesupport-messages-metadata-port"
blocked-by: null
closed-reason: null
---

## Context

PR #5353 ported `Messages::Codec` but deliberately did NOT mirror Rails'
`include Metadata` (`vendor/rails/activesupport/lib/active_support/messages/codec.rb:9`):
`messages/metadata.rb` has no TS counterpart, so `Codec`'s
`use_message_serializer_for_metadata?` (`codec.rb:59-61`, body
`!@force_legacy_metadata_serializer && super`) has no `super` to call and was
omitted rather than stubbed.

Consequences carried by `packages/activesupport/src/messages/codec.ts` today:

- `forceLegacyMetadataSerializer` is captured in the constructor and then
  never read.
- `MessageVerifier` open-codes its own `_expiresAt` / `_purpose` envelope in
  `generate` / `verifyMetadata` instead of Rails'
  `serialize_with_metadata` / `deserialize_with_metadata`
  (`message_verifier.rb:311,315`).
- `MessageEncryptor#readMessage` takes no options at all, so
  `expires_at:` / `expires_in:` / `purpose:` (`message_encryptor.rb:196-218`)
  are unsupported there.

## Acceptance criteria

- Port `vendor/rails/activesupport/lib/active_support/messages/metadata.rb`
  to `packages/activesupport/src/messages/metadata.ts`.
- Mix it into `Codec` and implement `useMessageSerializerForMetadata`, making
  `forceLegacyMetadataSerializer` load-bearing.
- Replace `MessageVerifier`'s bespoke envelope with
  `serializeWithMetadata` / `deserializeWithMetadata`, and give
  `MessageEncryptor` the same options surface.
- `pnpm parity:api --package activesupport` non-negative;
  `messages/codec.rb` and both message classes rise.
