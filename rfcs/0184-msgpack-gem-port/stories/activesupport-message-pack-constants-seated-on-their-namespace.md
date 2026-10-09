---
title: "activesupport: MessagePack's Extensions, error classes and Serializer::SIGNATURE are seated on their namespace"
status: draft
updated: 2026-10-09
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8694 made `ActiveSupport::MessagePack` a `Module` and seated `Serializer`
and `CacheSerializer` on it with `rbModConstSet`
(`packages/activesupport/src/message-pack.ts:22-24`). The rest of the constants
Rails defines in that namespace are still plain ES exports, reached only by
import, and carry no classpath:

- `vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/extensions.rb:14-15`
  defines `ActiveSupport::MessagePack::UnserializableObjectError` and
  `MissingClassError`; `extensions.rb:17` defines `module Extensions`. In trails
  they are exports of `packages/activesupport/src/message-pack/extensions.ts`,
  re-exported from `message-pack.ts:9-14`, and never seated on `MessagePack`.
  `cache_serializer.rb:13` rescues `ActiveSupport::MessagePack::MissingClassError`
  by its qualified name; `cache-serializer.ts` reads the import.
- `vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/serializer.rb:8-9`
  defines `Serializer::SIGNATURE` and `Serializer::SIGNATURE_INT` as constants of
  the module. In `packages/activesupport/src/message-pack/serializer.ts:7-8` they
  are unexported file-level `const`s, so `Serializer.SIGNATURE` does not exist.

## Acceptance criteria

- `Extensions`, `UnserializableObjectError` and `MissingClassError` are seated on
  `ActiveSupport.MessagePack` with `rbModConstSet` by their defining module
  (`extensions.ts`), so each is named `ActiveSupport::MessagePack::<Name>` and
  `ActiveSupport.MessagePack.MissingClassError` resolves at call time.
- `SIGNATURE` and `SIGNATURE_INT` are seated on the `Serializer` module
  (`serializer.rb:8-9`).
- No import cycle: each of `dist/message-pack.js`, `dist/message-pack/serializer.js`,
  `dist/message-pack/cache-serializer.js` and `dist/message-pack/extensions.js`
  loads as a plain-node entry module.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:extra:gate` and
  `parity:api:pins` non-negative; the message-pack tests green.
