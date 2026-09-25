---
title: "MessagePack::Serializer checks packers/unpackers out of a Factory#pool, not the Factory"
status: draft
updated: 2026-09-25
rfc: "0041-activesupport-messagepack-ext"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::MessagePack::Serializer#message_pack_pool`
(`vendor/rails/activesupport/lib/active_support/message_pack/serializer.rb:48-58`)
memoizes `message_pack_factory.pool(ENV.fetch("RAILS_MAX_THREADS", 5).to_i)` in
`@message_pack_pool`. `#dump` (`:11-17`) checks a packer out with
`message_pack_pool.packer do |packer| ... packer.full_pack end`.

In trails (`packages/activesupport/src/message-pack/serializer.ts`),
`messagePackPool()` returns the `Factory` itself, and its `installed` flag stands
in for `message_pack_factory.frozen?`. As of trails#8091, `Factory#unpacker(block)`
(`packages/activesupport/src/message-pack/factory.ts`) has msgpack's
`Pool#unpacker` semantics: it yields a fresh `Unpacker` and resets it afterwards.
So one class stands in for both msgpack's `Factory#unpacker(io)` and
`Pool#unpacker { }`. `dump` still uses `packer()` + `toBuffer()` rather than the
block form with `full_pack`. The `@missingRailsCall fetch — PERMANENT` on
`messagePackPool` covers the ENV read.

## Converged shape

- `Factory#pool(size)` returns a `Pool`, and `Pool#packer(block)` / `Pool#unpacker(block)` check out, yield and reset. `Factory#unpacker` goes back to the `(io)` form, and `Factory#freeze` / `isFrozen` replace `installed`.
- `messagePackPool` memoizes `this.messagePackFactory.pool(...)` behind `isFrozen()`, as `serializer.rb:48-58` does.
- `dump` becomes `messagePackPool().packer((packer) => { packer.write(SIGNATURE_INT); packer.write(object); return packer.fullPack(); })`.

## Acceptance criteria

- [ ] `Serializer#dump` / `#load` go through a `Pool`'s block-form `packer` / `unpacker`, and `Packer#fullPack` is ported.
- [ ] `Factory#unpacker` takes an io/buffer again, and the extension tests use it that way.
- [ ] `message_pack_factory.frozen?` / `freeze` replace the `installed` flag.
