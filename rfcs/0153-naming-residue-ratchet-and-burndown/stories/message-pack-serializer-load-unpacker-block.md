---
title: "message-pack-serializer-load-unpacker-block"
status: in-progress
updated: 2026-09-25
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 72
pr: trails#8091
claim: "2026-09-25T15:40:17Z"
assignee: "naming-activesupport-cache-coder-packed-header"
blocked-by: null
closed-reason: null
---

# MessagePack Serializer#load checks out the unpacker with a block

## Context

`ActiveSupport::MessagePack::Serializer#load`
(`vendor/rails/activesupport/lib/active_support/message_pack/serializer.rb:19-25`)
is

```ruby
message_pack_pool.unpacker do |unpacker|
  unpacker.feed_reference(dumped)
  raise "Invalid serialization format" unless unpacker.read == SIGNATURE_INT
  unpacker.full_unpack
end
```

The pool's `unpacker` takes no argument. It yields a pooled unpacker, and the body
feeds it. trails' `load` (`packages/activesupport/src/message-pack/serializer.ts`)
calls `this.messagePackPool().unpacker(dumped)`, which returns an unpacker that
has already been fed, and it reads with `read()` rather than `full_unpack`.

This surfaced once the call-args comparator stopped prepending a Ruby receiver
to a TS site that has its own receiver. The row is `unpacker()` against
`unpacker(ref:dumped)`, receipted `@missingRailsArgs unpacker — CONVERGEABLE`
pointing here.

## Acceptance criteria

- [ ] `unpacker` takes the block and checks the unpacker out of the pool. The
      body calls `feedReference(dumped)`, the `SIGNATURE_INT` check, and
      `fullUnpack`.
- [ ] The `@missingRailsArgs unpacker` receipt on `load` is deleted.
