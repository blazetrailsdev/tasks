---
title: "ActiveSupport::MessagePack imports the gem package; delete the hand-rolled factory"
status: in-progress
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: ["activesupport", "activerecord", "msgpack"]
deps:
  - msgpack-package-and-vendor-source
  - msgpack-factory-pool-and-default-factory
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8674
claim: "2026-10-08T12:23:42Z"
assignee: "msgpack-repoint-activesupport-onto-the-package"
blocked-by: null
closed-reason: null
---

## Context

With `@blazetrails/msgpack` in place (`msgpack-package-and-vendor-source`),
activesupport stops carrying a codec. Today
`packages/activesupport/src/message-pack/extensions.ts` and `serializer.ts`
import `Factory` / `Packer` / `Unpacker` / `MessagePackError` from the local
`factory.ts`; Rails imports them from the gem
(`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack.rb:5`).

The dependency is an OPTIONAL PEER, and that is fidelity rather than packaging
taste. `message_pack.rb:3-10` warns and re-raises on `LoadError`:

    begin
      gem "msgpack", ">= 1.7.0"
      require "msgpack"
    rescue LoadError => error
      warn "ActiveSupport::MessagePack requires the msgpack gem, ..."
      raise error
    end

`@blazetrails/nokogiri` already has exactly that shape in
`packages/activesupport/package.json` (`peerDependencies` plus
`peerDependenciesMeta.optional`), so the port of that `begin`/`rescue` has a real
mechanism under it instead of an unconditional import.

## Acceptance criteria

- `packages/activesupport/package.json` declares `@blazetrails/msgpack` as an
  OPTIONAL `peerDependency`, mirroring the `@blazetrails/nokogiri` entry.
- A `message-pack.ts` mirroring `message_pack.rb` ports the `begin`/`rescue
LoadError` arm: warn with Rails' message, then re-raise.
- `extensions.ts` and `serializer.ts` import `Factory` / `Packer` / `Unpacker`
  from `@blazetrails/msgpack`. Every `registerType` call keeps its Rails
  argument shape (`extensions.rb:20-110`) — no reshaping to
  `@msgpack/msgpack`'s `ExtensionCodec#register`.
- `packages/activesupport/src/message-pack/factory.ts` is DELETED, along with its
  `MessagePackError` and every `@internal` member.
- `packages/activerecord/src/encryption/message-pack-message-serializer.ts`'s
  rescue follows whatever `message-pack-serializer-load-raises-runtime-error`
  (done, trails#8584) left, now over the gem's error classes.
- `pnpm parity:api:extra --package activesupport` loses the `factory.ts` members;
  `parity:api` / `parity:test` deltas non-negative.
- `pnpm vitest run packages/activesupport/src/message-pack packages/activesupport/src/cache/serializer-with-fallback.test.ts packages/activesupport/src/messages packages/activerecord/src/encryption` green.
