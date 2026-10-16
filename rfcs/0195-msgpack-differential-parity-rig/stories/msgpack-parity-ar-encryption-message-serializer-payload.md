---
title: "msgpack parity: the ActiveRecord encryption MessagePack message serializer"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: serializer
packages: ["msgpack", "activerecord"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/encryption/message-pack-message-serializer.ts` is
the third consumer of the packer, and the one whose payloads are stored in a
database column rather than a cache. A divergence here is persistent: rows
written by a trails process must stay readable by a Ruby one, and vice versa,
for as long as the rows exist.

The serialized object is an `ActiveRecord::Encryption::Message` — a payload
plus headers — so the parity question is the message envelope.

## Acceptance criteria

- [ ] `MessagePackMessageSerializer.dump` compared byte for byte against the
      gem-backed Ruby equivalent for messages with: no headers, each header key
      the scheme can set, a nested message in a header, and a binary payload.
- [ ] A Ruby-produced message loads through the trails side with equal payload
      and headers.
- [ ] Binary payload bytes at and above 0x80 covered explicitly, since this
      path carries ciphertext rather than text.
- [ ] The serializer's rejection of an unsupported object asserted to match
      Rails' error class and message.
- [ ] Corpus cases committed.

## Notes

Keep these corpus cases in `packages/msgpack/parity/corpus/` with the others
per the RFC's Open Question 2, and import the activerecord types from the
corpus test rather than moving the corpus into activerecord.
