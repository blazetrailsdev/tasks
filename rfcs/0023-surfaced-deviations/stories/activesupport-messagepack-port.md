---
title: "Port ActiveSupport::MessagePack into activesupport; delegate encryption serializer to it"
status: ready
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["encryption-messagepack-serializer-binary-format"]
deps-rfc: []
est-loc: 400
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`ActiveSupport::MessagePack` is the real Rails home for MessagePack
serialization (`activesupport/lib/active_support/message_pack/`). The
encryption `MessagePackMessageSerializer`
(`activerecord/lib/active_record/encryption/message_pack_message_serializer.rb`)
does not implement MessagePack itself — it `require "active_support/message_pack"`
and delegates to `ActiveSupport::MessagePack.dump/load`.

In trails today that delegation is missing. PR #3215 (story
`encryption-messagepack-serializer-binary-format`) shipped a deliberately
minimal, MRI-byte-compatible codec **inline** at
`packages/activerecord/src/encryption/message-pack-codec.ts`, covering only the
subset the encryption serializer emits (nil/bool/int/str/bin/map). It is scoped
to that one story and the 300 LOC ceiling — it is NOT a faithful
`ActiveSupport::MessagePack` port.

`packages/activesupport/src/message-pack/` already holds placeholder test stubs
(`serializer.test.ts`, `cache-serializer.test.ts`) marking the intended home,
and there are other prospective consumers (`activerecord/src/message-pack.test.ts`,
actionpack cookies, the cache `serializer-with-fallback`).

## Scope

- Port `ActiveSupport::MessagePack` into `packages/activesupport/src/message-pack/`
  faithfully: the `Serializer` module (128 signature, `dump`/`load`/`signature?`),
  the `Factory`/type-registration surface, `Extensions` (Symbol/Time/BigDecimal/
  ActiveSupport types + unregistered-type error), and `CacheSerializer`.
- Repoint `MessagePackMessageSerializer` to delegate to it and delete the private
  `encryption/message-pack-codec.ts`.
- Pin against MRI fixtures (reuse the encryption fixture in #3215 plus
  extension-type fixtures).

## Acceptance criteria

- [ ] `ActiveSupport::MessagePack.dump/load` round-trips byte-identically with MRI
      for the registered extension types.
- [ ] The encryption serializer delegates to `ActiveSupport::MessagePack`; the
      private codec is removed; existing encryption message-pack tests stay green.
- [ ] Activesupport `message-pack/serializer` and `cache-serializer` placeholder
      tests are filled in (no renames of the Rails-matched names).

## Notes

This is the architectural follow-up surfaced in review of #3215: by strict Rails
fidelity the codec belongs in activesupport, but porting the full surface +
migrating consumers is larger than one story and was deliberately deferred to
keep #3215 scoped.
