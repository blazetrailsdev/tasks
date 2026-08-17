---
title: "KeyGenerator lacks the class-level hash_digest_class accessor and ships a bespoke inspect"
status: done
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6641
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`KeyGenerator` is missing Rails' class-level digest seat and ships a bespoke
`inspect`. Rails
(`vendor/rails/activesupport/lib/active_support/key_generator.rb:13-46`):

```ruby
class << self
  def hash_digest_class=(klass)
    if klass.kind_of?(Class) && klass < OpenSSL::Digest
      @hash_digest_class = klass
    else
      raise ArgumentError, "#{klass} is expected to be an OpenSSL::Digest subclass"
    end
  end

  def hash_digest_class
    @hash_digest_class ||= OpenSSL::Digest::SHA1
  end
end
...
def inspect # :nodoc:
  "#<#{self.class.name}:#{'%#016x' % (object_id << 1)}>"
end
```

Ours (`packages/activesupport/src/key-generator.ts`) has only a per-instance
`hashDigestClass` string option, no class-level accessor, no raising setter, and
`inspect()` returns `#<KeyGenerator secret="[FILTERED]" iterations=N>`. Three
`key_generator_test.rb` tests depend on the missing surface:

- `test "With custom hash digest class"` (:49-56) sets
  `ActiveSupport::KeyGenerator.hash_digest_class` and asserts an exact hex digest.
- `test "Raises if given a non digest instance"` (:58-61) asserts `ArgumentError`
  for both a non-digest class and an instance.
- `test "inspect does not show secrets"` (:63-65) asserts
  `/\A#<ActiveSupport::KeyGenerator:0x[0-9a-f]+>\z/`.

`test "Expected results"` (:31-44) also asserts three exact hex outputs, which
needs the default iteration count and digest to line up with Rails.

Note `Digest` already carries the ported shape of this accessor
(`packages/activesupport/src/digest.ts`, with the
"is expected to implement hexdigest class method" ArgumentError) — reuse that
precedent rather than inventing a second one. `CachingKeyGenerator#generateKey`
also fixes the arity at `(salt, keySize)` where Rails splats `*args` and joins
them for the cache key (`key_generator.rb:59-61`), which is what
`test "Does not cache key for different salts and lengths that are different but
are equal when concatenated"` (:96-101) probes.

## Converged shape

A static `hashDigestClass` getter/setter pair on `KeyGenerator` at the Rails
names, the setter raising `ArgumentError` for a non-digest argument, the
constructor defaulting `@hash_digest_class` from it, and `inspect()` spelled as
Rails spells it (a JS object has no `object_id`; use whatever identity token the
repo has settled on elsewhere and cite it, rather than leaking the secret or the
iteration count).

## Acceptance criteria

- `key_generator_test.rb` reports 0 assertion-count / 0 kind / 0 value in
  `pnpm parity:test -- --assertions --package activesupport`.
- `pnpm parity:api:extra --package activesupport` gains no novel surface;
  `pnpm parity:api:calls` and `pnpm parity:api:calls:args` gain no rows.
