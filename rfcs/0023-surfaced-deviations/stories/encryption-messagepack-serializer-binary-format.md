---
title: "Encryption MessagePackMessageSerializer uses JSON+latin1, not real MessagePack binary (MRI-incompatible)"
status: ready
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/encryption/message-pack-message-serializer.ts` is a
port shortcut: it serializes via `JSON.stringify` and renders raw cipher bytes
(payload/iv/at, now Buffers) as **latin1 byte-strings** (`bytesToString`). This
is internally consistent (round-trips within trails) but is **not** byte-compatible
with MRI, which uses real binary MessagePack
(`activerecord/lib/active_record/encryption/message_pack_message_serializer.rb`
→ `ActiveSupport::MessagePack`). A ciphertext written by Rails with
`message_serializer: :message_pack` will not deserialize in trails and vice
versa.

Surfaced while fixing `encryption-message-serializer-double-base64` (the JSON
`MessageSerializer` is now MRI byte-identical; MessagePack is not).

## Scope

- Replace the JSON-backed implementation with a real MessagePack codec that
  packs binary payload/iv/at as msgpack `bin` and text headers as `str`.
- Pin against an MRI-produced MessagePack fixture (commit the Ruby snippet).
- Keep `isBinary()` true.
- No new third-party runtime deps unless unavoidable — evaluate whether
  `@blazetrails/activesupport` already has/needs a msgpack codec.

## Acceptance criteria

- [ ] A MessagePack ciphertext produced by real Rails 8.0.2 decrypts in trails.
- [ ] A trails MessagePack ciphertext decrypts under the same keys in Rails.
- [ ] No test renames; existing message-pack tests stay green.
