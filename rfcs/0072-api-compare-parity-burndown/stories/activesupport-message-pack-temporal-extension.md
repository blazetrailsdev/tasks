---
title: "activesupport-message-pack-temporal-extension"
status: done
updated: 2026-07-30
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5634
claim: "2026-07-30T13:14:24Z"
assignee: "activesupport-message-pack-temporal-extension"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Messages::Metadata::TIMESTAMP_SERIALIZERS`
(`vendor/rails/activesupport/lib/active_support/messages/metadata.rb:19-22`)
lists the message_pack serializers: for those, `pick_expiry` leaves the expiry as
a raw `Time` instead of an ISO 8601 string, because message_pack can pack a
`Time` natively.

The trails port (`packages/activesupport/src/messages/metadata.ts`,
`pickExpiry`) is faithful and hands a raw `Temporal.Instant` through, but
`packages/activesupport/src/message-pack/extensions.ts` has no temporal packer at
all, so `MessagePack.dump` raises
`UnserializableObjectError: Unsupported type Instant`. That is why
`:message_pack` is excluded from the serializer matrix in
`packages/activesupport/src/messages/message-metadata-tests.ts`.

Per `project_js_date_rejected_temporal_is_time_analogue`, `Temporal` is the
trails `Time` analogue, so the packer should be Temporal-based.

## Acceptance criteria

- `packages/activesupport/src/message-pack/extensions.ts` packs/unpacks the
  temporal type(s) Rails' message_pack extensions cover, mirroring Rails'
  registered extension types and ids
  (`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb`).
- `:message_pack` can carry a `Metadata` expiry: adding
  `SERIALIZERS.message_pack` back to the metadata test serializer matrix passes.
- `pnpm parity:api --package activesupport` non-negative.
