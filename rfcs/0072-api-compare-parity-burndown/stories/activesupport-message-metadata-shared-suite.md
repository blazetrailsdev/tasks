---
title: "activesupport-message-metadata-shared-suite"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps:
  - activesupport-messages-metadata-port
deps-rfc: []
est-loc: null
priority: null
pr: 5867
claim: "2026-08-02T09:16:49Z"
assignee: "activesupport-message-metadata-shared-suite"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/test/messages/message_metadata_tests.rb` is the
shared `MessageMetadataTests` module Rails `include`s into both
`MessageVerifierMetadataTest` and `MessageEncryptorMetadataTest`. PR for
`activesupport-messages-metadata-port` ported only the module's private helpers
(`packages/activesupport/src/messages/message-metadata-tests.ts`:
`usingMessageSerializerForMetadata`, `freezeTime`, `eachScenario`) plus a subset
of the cases, to stay under the 500-LOC ceiling.

Still unported from `message_metadata_tests.rb`:

- `":purpose can be a symbol"` (metadata.rb:23-29) — decide whether JS has a
  meaningful analogue; `purpose` is compared through `to_s` either way.
  (`"expiration works with ActiveSupport.use_standard_json_time_format = false"`
  landed with the metadata port itself, along with
  `packages/activesupport/src/json/encoding.ts`.)

- `"message expires with :expires_at"`, `":expires_at overrides :expires_in"`,
  `"messages do not expire by default"`, `"metadata works with NullSerializer"`,
  `"messages with non-string purpose are readable"`,
  `"messages are readable regardless of use_message_serializer_for_metadata"`.
- Rails' `DATA` includes a `Time` and its `SERIALIZERS` include
  `ActiveSupport::MessagePack`; both are excluded today (see the follow-up story
  for the MessagePack temporal packer).

`message-encryptor-metadata.test.ts` currently carries only
`"message :purpose must match specified :purpose"` and
`"message expires with :expires_in"`.

## Acceptance criteria

- Port the remaining `MessageMetadataTests` cases into
  `packages/activesupport/src/messages/message-metadata-tests.ts` and run them
  from both `message-verifier-metadata.test.ts` and
  `message-encryptor-metadata.test.ts`, with Rails' test names verbatim.
- Any case that cannot run states why at the call site (not the PR body).
- `pnpm parity:test --package activesupport` non-negative.
