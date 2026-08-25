---
title: "Construct the Message after parsing properties in hash_to_message"
status: done
updated: 2026-08-14
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6493
claim: "2026-08-13T20:57:11Z"
assignee: "converge-hash-to-message-construction-order"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/message-pack-message-serializer.ts#hashToMessage`
builds its `Message` at a different point in the body than Rails does, which the
call-order gate reports as
`activerecord encryption/message-pack-message-serializer.ts hash_to_message order:constructor,parseProperties`
(baselined in `call-mismatches-exclude/activerecord/encryption/message-pack-message-serializer.json`).

Rails (`vendor/rails/activerecord/lib/active_record/encryption/message_pack_message_serializer.rb`,
`#hash_to_message`) parses the properties first and constructs
`Message.new(payload:, headers:)` last. The port constructs first and parses
after, so the two sequences invert.

PR #6464 verified this row is NOT the `throw new` extractor artifact it was
originally attributed to (RFC 0084 `extractor-throw-new-constructor-credit-order`):
it survives the raise-position `new` filter, so it is a genuine body-order
divergence.

## Converged shape

Reorder `hashToMessage` to Rails' statement order — parse the properties, then
construct the `Message` from them — and delete the baseline row by hand
(only-shrink).

## Acceptance criteria

- [ ] `hashToMessage` constructs the `Message` after parsing the properties, as
      `message_pack_message_serializer.rb#hash_to_message` does.
- [ ] The `order:constructor,parseProperties` row is deleted from
      `call-mismatches-exclude/activerecord/encryption/message-pack-message-serializer.json`.
- [ ] `pnpm parity:api:calls` green; encryption suites green.
