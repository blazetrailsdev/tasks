---
title: "binary-type-serialize-returns-data-wrapper"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveModel::Type::Binary#serialize` wraps its result in the `Data`
value object:

```ruby
def serialize(value)
  return if value.nil?
  Data.new(super)
end
```

(`vendor/rails/activemodel/lib/active_model/type/binary.rb:30-33`)

trails' `BinaryType#serialize` instead delegates straight to `cast`, which
_unwraps_ `Data` and returns a bare `Uint8Array`:

```ts
cast(value: unknown): Uint8Array | null {
  if (value instanceof Data) return value.bytes;   // binary.ts:19
  ...
}
serialize(value: unknown): Uint8Array | null {
  return this.cast(value);                          // binary.ts:24-26
}
```

(`packages/activemodel/src/type/binary.ts:17-26`)

So the `Type::Binary::Data` wrapper — which is precisely the signal Rails'
`quote` dispatches on at `abstract/quoting.rb:83` (`when Type::Binary::Data then
quoted_binary(value)`) — never reaches the quoting layer from the type. Trails'
adapters compensate with raw-`Uint8Array`/`ArrayBuffer` boundary branches in
`quote` that Rails does not have (PG `quoting.ts:165`, MySQL `quoting.ts:190`,
SQLite `quoting.ts:95`).

Surfaced in review of #4870, which ported rb:83 and made binary self-dispatch
through the host. That PR documents the deviation but deliberately does not
converge it: changing `serialize`'s return type ripples through the type/attribute
layer (`isChangedInPlace`, `deserialize`, schema defaults, encryption's
serialized-binary path) and is well beyond a quoting change.

Note the related deviation in `cast`: Rails' `cast` returns a **String**
(`value.to_s` for `Data`, else `super` re-encoded to `Encoding::BINARY`), while
trails' returns `Uint8Array`. JS has no separate byte-string type, so
`Uint8Array` is the reasonable stand-in for Ruby's binary-encoded String — the
divergence to fix is the missing `Data` wrapper in `serialize`, not the byte
representation itself.

## Acceptance criteria

- [ ] `BinaryType#serialize` returns a `Data` (BinaryData) wrapper, mirroring
      `Data.new(super)` at `activemodel/.../binary.rb:31`, and returns
      `null`/`undefined` for nil rather than wrapping it.
- [ ] The adapters' raw-`Uint8Array`/`ArrayBuffer` boundary branches in `quote`
      are re-evaluated once the type emits `BinaryData`: delete any that only
      existed to catch the unwrapped bytes, or document each survivor with the
      caller that still passes a raw view.
- [ ] Binary round-trips unchanged on all three adapters (`binary.test.ts`,
      `bytea.test.ts`, encryption's serialized-binary-on-text path — see
      `project_encryption_binary_column_text_message_roundtrip_gap`).
- [ ] `isChangedInPlace` / `deserialize` still compare bytes, not wrapper
      identity.
- [ ] api:compare / test:compare delta non-negative.
