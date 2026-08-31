---
title: "MessageSerializer.dump narrows Ruby's duck type to string, forcing three casts on the identity NullSerializer"
status: draft
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7270 while converging `NullSerializer`
(`null-serializer-dump-raises-where-rails-is-identity`).

`vendor/rails/activesupport/lib/active_support/messages/codec.rb:35-37` calls
the serializer duck-typed, constraining nothing about the return:

```ruby
def serialize(data)
  serializer.dump(data)
end
```

and `message_encryptor.rb:105-113`'s `NullSerializer` is a pure identity pair:

```ruby
module NullSerializer # :nodoc:
  def self.load(value); value; end
  def self.dump(value); value; end
end
```

trails' `MessageSerializer` (`packages/activesupport/src/messages/codec.ts:17-20`)
narrows the duck type to a `string` return that Ruby never states:

```ts
export interface MessageSerializer {
  dump(value: unknown): string;
  load(dumped: string): unknown;
}
```

`NullSerializer.dump` — correctly ported by #7270 as `(value: unknown): unknown`,
Rails' identity — therefore does **not** satisfy trails' own serializer
interface, and the three sites that hand it over each carry an `as
MessageSerializer` cast that Rails has no counterpart for:

- `packages/activesupport/src/message-encryptor.ts:103` (the non-AEAD verifier)
- `packages/activesupport/src/message-encryptor.test.ts:38`
- `packages/activesupport/src/messages/message-metadata-tests.ts:241`

The casts are load-bearing in the type system only; at runtime the value
NullSerializer passes through is always the already-encoded ciphertext String,
so nothing misbehaves today. But an `as` on every use of a first-party
serializer is a signal the interface is wrong, not the serializer.

## Converged shape

Widen the duck type's `dump` to the unconstrained return Ruby has, so an
identity serializer satisfies it without a cast:

```ts
export interface MessageSerializer {
  dump(value: unknown): unknown;
  load(dumped: string): unknown;
}
```

and delete the three `as MessageSerializer` casts. `Codec#serialize`
(`codec.ts`, mirroring `codec.rb:35-37`) already passes the result straight to
`encode`, so whatever narrowing `encode` genuinely needs belongs at that call
site — where Ruby's `::Base64.strict_encode64` would raise on a non-String —
not in the interface every serializer must satisfy.

## Acceptance criteria

- [ ] `MessageSerializer.dump` no longer declares a `string` return.
- [ ] The three `as MessageSerializer` casts listed above are gone, and
      `NullSerializer` satisfies the interface as written.
- [ ] `message-encryptor.test.ts`, `message-verifier.test.ts` and the
      `messages/*` suites pass unchanged.
- [ ] `pnpm parity:api:extra` for activesupport does not increase.
