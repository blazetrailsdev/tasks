---
title: "msgpack parity: MessagePack::CacheSerializer over a Cache::Entry"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
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

`ActiveSupport::MessagePack::CacheSerializer`
(`packages/activesupport/src/message-pack/cache-serializer.ts`) is what writes
a `Rails.cache` entry. This is the payload a Ruby process sharing a Redis or
Memcached instance reads, so it is the highest-consequence surface in the RFC.

A `Cache::Entry` carries a value plus expiry and version metadata, so the
parity question is the whole envelope, not just the value.

## Acceptance criteria

- [ ] `CacheSerializer.dump` compared byte for byte against the gem-backed Ruby
      equivalent for entries wrapping values from the Phase 2 and Phase 3
      generators.
- [ ] Entry metadata covered: no expiry, an absolute expiry, a version string,
      a nil version, and the compression threshold boundary on both sides.
- [ ] A Ruby-produced entry loads through the trails side with equal value,
      expiry and version.
- [ ] The dumped-but-not-loadable path covered: an entry whose value is an
      unregistered type, under both type 127 installers.
- [ ] Corpus cases committed.

## Notes

`vendor/rails/v8.0.2/activesupport/test/message_pack/cache_serializer_test.rb`
and `shared_serializer_tests.rb` show which entry shapes Rails itself considers
load-bearing. Read them before choosing the metadata matrix.
