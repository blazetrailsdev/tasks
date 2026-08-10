---
title: "Run the Messages::Metadata shared cases over the MessagePack serializer"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6129
claim: "2026-08-05T15:01:05Z"
assignee: "vendor-ruby-date-gem"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/test/messages/message_metadata_tests.rb` drives its
cases over `SERIALIZERS`, which includes `ActiveSupport::MessagePack`, and over a
`DATA` set that includes a `Time`. The trails port
(`packages/activesupport/src/messages/message-metadata-tests.ts:36`) still
iterates only `["marshal", "json"]`.

The original reason for the exclusion is gone: PR #5634 registered MessagePack
extension types 5-8, so `MessagePack.dump` now packs the raw `Temporal.Instant`
that `Metadata.pickExpiry` hands through for the timestamp serializers
(`vendor/rails/activesupport/lib/active_support/messages/metadata.rb:19-22`,
`TIMESTAMP_SERIALIZERS`). It previously raised
`UnserializableObjectError: Unsupported type Instant`.

Overlaps with `activesupport-message-metadata-shared-suite` (same file); whoever
picks that up second should fold this in rather than duplicating.

## Acceptance criteria

- `message-metadata-tests.ts` iterates the MessagePack serializer alongside
  marshal and json, and the `DATA` set covers a temporal value, matching Rails.
- The expiry-carrying cases pass under the MessagePack serializer, exercising
  the `TIMESTAMP_SERIALIZERS` raw-`Instant` path rather than the ISO 8601 string.
- `pnpm parity:test --package activesupport` non-negative.
