---
title: "uuid_from_hash takes an algorithm string where Rails takes the digest class"
status: ready
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 43
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Digest::UUID.uuid_from_hash`
(`vendor/rails/activesupport/lib/active_support/core_ext/digest/uuid.rb:19-39`)
takes the digest CLASS and calls `.new` on it:

```ruby
def self.uuid_from_hash(hash_class, namespace, name)
  if hash_class == Digest::MD5 || hash_class == OpenSSL::Digest::MD5
    version = 3
  elsif hash_class == Digest::SHA1 || hash_class == OpenSSL::Digest::SHA1
    version = 5
  else
    raise ArgumentError, "Expected OpenSSL::Digest::SHA1 or OpenSSL::Digest::MD5, got #{hash_class.name}."
  end
  ...
  hash = hash_class.new
  hash.update(uuid_namespace)
  hash.update(name)
```

The port (`packages/activesupport/src/core-ext/digest/uuid.ts:22-40`) takes an
algorithm STRING (`"md5"` / `"sha1"`), branches on that string, and builds the
hash with `getCrypto().createHash(hashClass)`. `uuid_v3` / `uuid_v5`
(`uuid.rb:43,48`) pass `OpenSSL::Digest::MD5` / `OpenSSL::Digest::SHA1`, so the
port's `uuidV3`/`uuidV5` pass `"md5"`/`"sha1"` instead of the constants.

PR #7492 seated `Digest::MD5` / `SHA1` / `SHA256` and `OpenSSL::Digest`
(`packages/ruby-compat/src/digest.ts`) with a `DigestClass#new` returning a
`DigestInstance` that has `update` / `hexdigest`, so the class this signature
wants now exists and the equality branch has real constants to compare against.

## Acceptance criteria

- `uuidFromHash(hashClass, namespace, name)` takes a `DigestClass`, branches on
  `hashClass === Digest.MD5 || hashClass === OpenSSL.Digest.MD5` and the SHA1
  pair, and builds the running digest with `hashClass.new()` — matching
  `uuid.rb:19-33`.
- The `ArgumentError` message keeps Rails' text, with `hash_class.name`
  answering the constant's name rather than an algorithm string.
- `uuidV3` / `uuidV5` pass `OpenSSL.Digest.MD5` / `OpenSSL.Digest.SHA1`
  (`uuid.rb:43,48`).
- `getCrypto()` is gone from the file; `uuid.test.ts` passes unchanged.
