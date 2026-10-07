---
title: "activerecord: DerivedSecretKeyProvider derives its keys without a fabricated receiver"
status: done
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8652
claim: "2026-10-07T18:33:29Z"
assignee: "sqlite3-adapter-quote-default-expression-duplicates-quoting-mixin"
blocked-by: null
closed-reason: null
---

## Context

Rails' constructor derives each key through its own private method
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/derived_secret_key_provider.rb:7-15`):

```ruby
def initialize(passwords, key_generator: ActiveRecord::Encryption.key_generator)
  super(Array(passwords).collect { |password| derive_key_from(password, using: key_generator) })
end

private
  def derive_key_from(password, using: key_generator)
    secret = using.derive_key_from(password)
    ActiveRecord::Encryption::Key.new(secret)
  end
```

`packages/activerecord/src/encryption/derived-secret-key-provider.ts` cannot
name `this` before `super()`, so it reaches the method as
`DerivedSecretKeyProvider.prototype.deriveKeyFrom.call({} as DerivedSecretKeyProvider, password, { using: keyGenerator })`
and adds a `_keyGenerator` field Rails does not have, to back the `using:`
default (Rails' default names `key_generator`, which is only in scope inside
`initialize`).

## Acceptance criteria

- [ ] The constructor calls `deriveKeyFrom` without a fabricated `{}` receiver.
      `KeyProvider#initialize` (`key_provider.rb:11-13`) only stores `@keys`, so
      the keys can be assigned after `super()` if that is what the language
      allows; say which at the call site.
- [ ] The `_keyGenerator` field is deleted or receipted.
- [ ] `encryption/derived-secret-key-provider.test.ts` and
      `encryption/deterministic-key-provider.test.ts` pass.
