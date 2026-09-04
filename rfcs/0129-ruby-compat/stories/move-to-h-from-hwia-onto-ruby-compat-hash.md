---
title: "Hash#to_h belongs on ruby-compat's Hash, not on HashWithIndifferentAccess"
status: done
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 15
pr: 7485
claim: "2026-09-04T15:50:46Z"
assignee: "route-remaining-default-env-call-sites"
blocked-by: null
closed-reason: null
---

## Context

Ruby defines `to_h` on `Hash` (`vendor/ruby/hash.c:3018` `rb_hash_to_h`), not on
`ActiveSupport::HashWithIndifferentAccess` — `hash_with_indifferent_access.rb`
inherits it. #7431 needed that method for
`write_hash_with_indifferent_access`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:236-238`,
`packer.write(hwia.to_h)`) and had to put it on
`HashWithIndifferentAccess#toH` (`packages/activesupport/src/hash-with-indifferent-access.ts`)
instead of on the `Hash` it extends
(`packages/ruby-compat/src/hash.ts:319`), because
`packages/rack/src/headers.ts:123` already declares

```ts
toH(): Record<string, string> {
  return this.toHash();
}
```

on `class Headers extends Hash<string, string>`. A `Hash#toH(): Hash<K, V>`
makes that an incompatible override and reds `pnpm typecheck`:

```text
packages/rack/src/headers.ts(123,3): error TS2416: Property 'toH' in type
'Headers' is not assignable to the same property in base type 'Hash<string, string>'.
```

So the method sits one class lower than Ruby puts it, and every OTHER
`Hash` subclass in the repo lacks `to_h`.

## Converged shape

`Hash#toH()` on `packages/ruby-compat/src/hash.ts`, mirroring `rb_hash_to_h`:
the receiver itself when `this.constructor === Hash`, otherwise a `hash_dup`
into a bare `Hash` carrying the same entries and the same
`default` / `default_proc` (verified against MRI: `Hash.new(5).to_h.equal?(h)`
is `true`; a subclass receiver answers a bare `Hash` whose `default_proc`
survives). Then `HashWithIndifferentAccess#toH` is deleted and inherited, the
way `hash_with_indifferent_access.rb` inherits it.

`rack`'s `Headers#toH` is the blocker and has to be resolved first. Rack is not
vendored under `vendor/`, so the first step is establishing what
`Rack::Headers` actually does with `to_h` — whether it overrides it at all.
Either it does, in which case the trails override returns the ruby-compat
`Hash` its Ruby counterpart returns (and `headers.test.ts:385-386`'s
`toEqual({})` assertion moves with it), or it does not, in which case the
override is invented surface and is deleted outright.

## Acceptance criteria

- `toH` is declared on `packages/ruby-compat/src/hash.ts`'s `Hash`, with an MRI
  citation, and `HashWithIndifferentAccess#toH` is gone.
- `packages/rack/src/headers.ts`'s `toH` either matches its Rack counterpart or
  is deleted, with the Rack source cited either way.
- `pnpm typecheck` is clean and the msgpack type-17 round-trip
  (`message-pack/extensions.trails.test.ts`) still packs a nested
  `HashWithIndifferentAccess` through the recursive handler.
