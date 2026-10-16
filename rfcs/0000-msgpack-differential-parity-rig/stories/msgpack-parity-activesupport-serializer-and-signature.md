---
title: "msgpack parity: ActiveSupport::MessagePack dump, load and the payload signature"
status: draft
updated: 2026-10-16
rfc: "0000-msgpack-differential-parity-rig"
cluster: serializer
packages: ["msgpack", "activesupport"]
deps: ["msgpack-parity-corpus-format-and-ci-test"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Phase 4 moves above the packer to the serializer layers a Rails process
actually reads. `ActiveSupport::MessagePack` prepends a signature to its
payload, and `isSignature` is what `SerializerWithFallback` sniffs to decide a
payload is msgpack at all
(`packages/activesupport/src/messages/serializer-with-fallback.ts:161-162`).

A wrong signature byte means a Ruby reader misroutes the whole payload, which
is a worse failure than a wrong value inside it.

## Acceptance criteria

- [ ] `ActiveSupport::MessagePack.dump` output compared byte for byte against
      the gem-backed Ruby equivalent, over values drawn from the Phase 2 and
      Phase 3 generators.
- [ ] The signature prefix asserted exactly, including its version byte.
- [ ] `isSignature` asserted true for every Ruby-produced payload and false for
      a bare msgpack payload with no signature.
- [ ] A payload the Ruby side produced loads through the trails side to an
      equal value, and re-dumps byte-identically.
- [ ] Corpus cases committed.

## Notes

The Ruby side here is `ActiveSupport::MessagePack` from the installed
`activesupport 8.0.2` gem, which matches `vendor/rails/v8.0.2/`. Pin it the way
`oracle.rb` pins msgpack.
